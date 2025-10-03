import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  uploadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Upload',
    required: true
  },
  scores: {
    data: Number,
    coverage: Number,
    rules: Number,
    posture: Number,
    overall: Number
  },
  coverage: {
    matched: [String],
    close: [{
      target: String,
      candidate: String,
      confidence: Number
    }],
    missing: [String]
  },
  ruleFindings: [{
    rule: String,
    ok: Boolean,
    exampleLine: Number,
    expected: String,
    got: String,
    value: String
  }],
  gaps: [String],
  meta: {
    rowsParsed: Number,
    linesTotal: Number,
    country: String,
    erp: String,
    db: String
  }
}, {
  timestamps: true
});

// Auto-delete reports after 7 days
reportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model('Report', reportSchema);