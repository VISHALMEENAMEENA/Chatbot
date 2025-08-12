const mongoose = require('mongoose');

const GeneratedContentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'image', 'video', 'audio'], required: true },
  prompt: { type: String, required: true },
  url: { type: String },
  data: { type: String }, // For text or metadata
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GeneratedContent', GeneratedContentSchema);