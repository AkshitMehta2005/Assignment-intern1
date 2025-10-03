import mongoose from 'mongoose';

const uploadSchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    unique: true
  },
  originalFilename: String,
  fileType: String,
  rawData: Array,
  parsedData: Array,
  country: String,
  erp: String,
  rowsParsed: Number
}, {
  timestamps: true
});

// Auto-delete uploads after 7 days
uploadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export default mongoose.model('Upload', uploadSchema);