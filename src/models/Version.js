import mongoose from 'mongoose';

const VersionSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: true,
  },
  content: {
    type: Object, // TipTap JSON
    required: true,
  },
  htmlContent: {
    type: String,
  },
  versionName: {
    type: String,
    default: 'Auto-save',
  },
  createdBy: {
    type: String,
    default: 'System',
  },
  metadata: {
    wordCount: Number,
    seoScore: Number,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
VersionSchema.index({ postId: 1, createdAt: -1 });

export default mongoose.models.Version || mongoose.model('Version', VersionSchema);
