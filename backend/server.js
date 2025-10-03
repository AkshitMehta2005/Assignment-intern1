import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import models
import Upload from './models/Upload.js';
import Report from './models/Report.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://akshitcontact007:12345678pq@cluster0.ht6crgp.mongodb.net/';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Mock GETS schema
const GETS_SCHEMA = [
  'invoice.id', 'invoice.issue_date', 'invoice.currency', 'invoice.total_excl_vat',
  'invoice.vat_amount', 'invoice.total_incl_vat', 'seller.name', 'seller.trn',
  'seller.country', 'seller.city', 'buyer.name', 'buyer.trn', 'buyer.country',
  'buyer.city', 'lines[].sku', 'lines[].description', 'lines[].qty',
  'lines[].unit_price', 'lines[].line_total'
];

// Utility functions
const normalizeFieldName = (name) => {
  return name.toLowerCase().replace(/[_\s]/g, '').trim();
};

const detectFieldType = (value) => {
  if (!value && value !== 0) return 'unknown';
  
  // Check for number
  if (!isNaN(parseFloat(value)) && isFinite(value)) return 'number';
  
  // Check for date (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (dateRegex.test(value)) return 'date';
  
  return 'text';
};

const calculateSimilarity = (field1, field2) => {
  const normalized1 = normalizeFieldName(field1);
  const normalized2 = normalizeFieldName(field2);
  
  if (normalized1 === normalized2) return 1.0;
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return 0.8;
  
  // Simple edit distance-based similarity
  const longer = Math.max(normalized1.length, normalized2.length);
  const editDistance = longer - Math.abs(normalized1.length - normalized2.length);
  return editDistance / longer;
};

const mapFieldsToGETS = (sampleRow) => {
  const matched = [];
  const close = [];
  const missing = [...GETS_SCHEMA];
  
  Object.keys(sampleRow).forEach(sourceField => {
    let bestMatch = null;
    let bestScore = 0;
    
    GETS_SCHEMA.forEach(getsField => {
      const score = calculateSimilarity(sourceField, getsField);
      if (score > bestScore && score > 0.6) {
        bestScore = score;
        bestMatch = getsField;
      }
    });
    
    if (bestMatch && bestScore > 0.9) {
      matched.push(bestMatch);
      const index = missing.indexOf(bestMatch);
      if (index > -1) missing.splice(index, 1);
    } else if (bestMatch && bestScore > 0.6) {
      close.push({
        target: bestMatch,
        candidate: sourceField,
        confidence: Math.round(bestScore * 100) / 100
      });
      const index = missing.indexOf(bestMatch);
      if (index > -1) missing.splice(index, 1);
    }
  });
  
  return { matched, close, missing };
};

const validateRules = (data) => {
  const findings = [];
  
  // Rule 1: TOTALS_BALANCE
  let totalsBalanceOk = true;
  data.forEach((row, index) => {
    const totalExcl = parseFloat(row.total_excl_vat) || parseFloat(row.totalExclVat) || parseFloat(row.total_excl) || 0;
    const vatAmount = parseFloat(row.vat_amount) || parseFloat(row.vatAmount) || parseFloat(row.vat) || 0;
    const totalIncl = parseFloat(row.total_incl_vat) || parseFloat(row.totalInclVat) || parseFloat(row.total_incl) || parseFloat(row.total) || 0;
    
    if (totalExcl && vatAmount && totalIncl) {
      if (Math.abs((totalExcl + vatAmount) - totalIncl) > 0.01) {
        totalsBalanceOk = false;
      }
    }
  });
  findings.push({ rule: 'TOTALS_BALANCE', ok: totalsBalanceOk });
  
  // Rule 2: LINE_MATH
  let lineMathOk = true;
  let exampleLine = null;
  data.forEach((row, index) => {
    const qty = parseFloat(row.qty) || parseFloat(row.quantity) || 0;
    const unitPrice = parseFloat(row.unit_price) || parseFloat(row.unitPrice) || parseFloat(row.price) || 0;
    const lineTotal = parseFloat(row.line_total) || parseFloat(row.lineTotal) || parseFloat(row.total) || 0;
    
    if (qty && unitPrice && lineTotal) {
      if (Math.abs((qty * unitPrice) - lineTotal) > 0.01) {
        lineMathOk = false;
        exampleLine = index + 1;
      }
    }
  });
  findings.push({ 
    rule: 'LINE_MATH', 
    ok: lineMathOk,
    ...(lineMathOk ? {} : { 
      exampleLine, 
      expected: 'qty * unit_price', 
      got: 'line_total' 
    })
  });
  
  // Rule 3: DATE_ISO
  let dateIsoOk = true;
  let badDateExample = null;
  data.forEach(row => {
    const date = row.issue_date || row.issueDate || row.date;
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        dateIsoOk = false;
        badDateExample = date;
      }
    }
  });
  findings.push({ 
    rule: 'DATE_ISO', 
    ok: dateIsoOk,
    ...(dateIsoOk ? {} : { value: badDateExample })
  });
  
  // Rule 4: CURRENCY_ALLOWED
  let currencyOk = true;
  let badValue = null;
  const allowedCurrencies = ['AED', 'SAR', 'MYR', 'USD'];
  data.forEach(row => {
    const currency = row.currency || row.curr;
    if (currency && !allowedCurrencies.includes(currency.toUpperCase())) {
      currencyOk = false;
      badValue = currency;
    }
  });
  findings.push({ 
    rule: 'CURRENCY_ALLOWED', 
    ok: currencyOk,
    ...(currencyOk ? {} : { value: badValue })
  });
  
  // Rule 5: TRN_PRESENT
  let trnOk = true;
  data.forEach(row => {
    const buyerTrn = row.buyer_trn || row.buyerTrn || row.buyer_tax_id;
    const sellerTrn = row.seller_trn || row.sellerTrn || row.seller_tax_id;
    
    if (!buyerTrn || !sellerTrn) {
      trnOk = false;
    }
  });
  findings.push({ rule: 'TRN_PRESENT', ok: trnOk });
  
  return findings;
};

const calculateScores = (data, coverage, ruleFindings, questionnaire) => {
  // Data score (25%) - based on rows parsed and type inference
  const dataScore = Math.min(100, Math.round((data.length / 200) * 100));
  
  // Coverage score (35%) - based on matched fields
  const coverageScore = Math.round((coverage.matched.length / GETS_SCHEMA.length) * 100);
  
  // Rules score (30%) - based on passed rules
  const passedRules = ruleFindings.filter(rule => rule.ok).length;
  const rulesScore = Math.round((passedRules / ruleFindings.length) * 100);
  
  // Posture score (10%) - from questionnaire
  const postureAnswers = Object.values(questionnaire).filter(Boolean).length;
  const postureScore = Math.round((postureAnswers / Object.keys(questionnaire).length) * 100);
  
  // Overall score (weighted sum)
  const overall = Math.round(
    (dataScore * 0.25) +
    (coverageScore * 0.35) +
    (rulesScore * 0.30) +
    (postureScore * 0.10)
  );
  
  return {
    data: dataScore,
    coverage: coverageScore,
    rules: rulesScore,
    posture: postureScore,
    overall
  };
};

// Routes

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      database: 'mongodb', 
      dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Upload request received:', {
      file: req.file ? req.file.originalname : 'No file',
      hasText: !!req.body.text,
      country: req.body.country,
      erp: req.body.erp
    });

    let data = [];
    
    if (req.file) {
      // File upload
      const filePath = req.file.path;
      console.log('📄 Processing file:', req.file.originalname);
      
      if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
        // Parse CSV
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              if (data.length < 200) data.push(row);
            })
            .on('end', () => {
              console.log('✅ CSV parsing completed. Rows:', data.length);
              resolve();
            })
            .on('error', (error) => {
              console.error('❌ CSV parsing error:', error);
              reject(error);
            });
        });
      } else if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
        // Parse JSON
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const jsonData = JSON.parse(fileContent);
          data = Array.isArray(jsonData) ? jsonData.slice(0, 200) : [jsonData];
          console.log('✅ JSON parsing completed. Rows:', data.length);
        } catch (jsonError) {
          console.error('❌ JSON parsing error:', jsonError);
          return res.status(400).json({ error: 'Invalid JSON format' });
        }
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Use CSV or JSON.' });
      }
      
      // Clean up file
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.warn('⚠️ Could not delete temp file:', unlinkError);
      }
    } else if (req.body.text) {
      // Text paste
      console.log('📝 Processing text data, length:', req.body.text.length);
      try {
        const text = req.body.text.trim();
        if (text.startsWith('[') || text.startsWith('{')) {
          // JSON data
          data = JSON.parse(text);
          if (!Array.isArray(data)) {
            data = [data];
          }
          data = data.slice(0, 200);
        } else {
          // CSV data
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const headers = lines[0].split(',').map(h => h.trim());
            
            for (let i = 1; i < Math.min(lines.length, 201); i++) {
              const values = lines[i].split(',').map(v => v.trim());
              const row = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              data.push(row);
            }
          }
        }
        console.log('✅ Text parsing completed. Rows:', data.length);
      } catch (parseError) {
        console.error('❌ Text parsing error:', parseError);
        return res.status(400).json({ error: 'Invalid data format. Use valid CSV or JSON.' });
      }
    } else {
      return res.status(400).json({ error: 'No file or text data provided' });
    }
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'No valid data found in the uploaded file' });
    }
    
    const uploadId = `u_${uuidv4().split('-')[0]}`;
    
    const uploadDoc = new Upload({
      uploadId,
      originalFilename: req.file?.originalname || 'pasted_data',
      fileType: req.file?.mimetype || 'text',
      rawData: data,
      parsedData: data,
      country: req.body.country || 'Unknown',
      erp: req.body.erp || 'Unknown',
      rowsParsed: data.length
    });
    
    await uploadDoc.save();
    console.log('💾 Upload saved with ID:', uploadId);
    
    res.json({ 
      uploadId,
      message: `Successfully processed ${data.length} rows`
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      details: error.message 
    });
  }
});

// Analyze endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { uploadId, questionnaire = { webhooks: false, sandbox_env: false, retries: false } } = req.body;
    
    if (!uploadId) {
      return res.status(400).json({ error: 'uploadId is required' });
    }
    
    console.log('🔍 Analysis request for upload:', uploadId);
    
    const upload = await Upload.findOne({ uploadId });
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }
    
    const data = upload.parsedData;
    const sampleRow = data[0] || {};
    
    // Field mapping
    const coverage = mapFieldsToGETS(sampleRow);
    
    // Rule validation
    const ruleFindings = validateRules(data);
    
    // Calculate scores
    const scores = calculateScores(data, coverage, ruleFindings, questionnaire);
    
    // Generate gaps list
    const gaps = [];
    if (!ruleFindings[0].ok) gaps.push('Total amounts do not balance');
    if (!ruleFindings[1].ok) gaps.push('Line item calculations incorrect');
    if (!ruleFindings[2].ok) gaps.push('Invalid date format (use YYYY-MM-DD)');
    if (!ruleFindings[3].ok) gaps.push(`Invalid currency ${ruleFindings[3].value}`);
    if (!ruleFindings[4].ok) gaps.push('Missing TRN for buyer or seller');
    
    coverage.missing.forEach(field => {
      gaps.push(`Missing ${field}`);
    });
    
    const reportId = `r_${uuidv4().split('-')[0]}`;
    
    const report = {
      reportId,
      scores,
      coverage,
      ruleFindings,
      gaps,
      meta: {
        rowsParsed: data.length,
        linesTotal: data.length,
        country: upload.country,
        erp: upload.erp,
        db: 'mongodb'
      }
    };
    
    const reportDoc = new Report({
      reportId,
      uploadId: upload._id,
      scores,
      coverage,
      ruleFindings,
      gaps,
      meta: report.meta
    });
    
    await reportDoc.save();
    
    console.log('📊 Analysis completed. Report ID:', reportId);
    
    res.json(report);
  } catch (error) {
    console.error('❌ Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Get report endpoint
app.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    console.log('📋 Fetching report:', reportId);
    
    const report = await Report.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({
      reportId: report.reportId,
      scores: report.scores,
      coverage: report.coverage,
      ruleFindings: report.ruleFindings,
      gaps: report.gaps,
      meta: report.meta
    });
  } catch (error) {
    console.error('❌ Report fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Get recent reports (P1 feature)
app.get('/reports', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('reportId scores.overall meta.country meta.erp meta.rowsParsed createdAt');
    
    res.json(reports);
  } catch (error) {
    console.error('❌ Recent reports error:', error);
    res.status(500).json({ error: 'Failed to fetch recent reports' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'E-Invoicing Readiness Analyzer API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      upload: 'POST /upload',
      analyze: 'POST /analyze',
      report: 'GET /report/:id',
      recent: 'GET /reports?limit=10'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🚨 Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API docs: http://localhost:${PORT}/`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

export default app;