import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
  },
  filename: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document'],
    required: true,
  },
  mimeType: {
    type: String,
  },
  fileSize: {
    type: Number, // in bytes
  },
  altText: {
    type: String,
  },
  caption: {
    type: String,
  },
  width: {
    type: Number,
  },
  height: {
    type: Number,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
MediaSchema.index({ postId: 1, createdAt: -1 });
MediaSchema.index({ fileType: 1 });

export default mongoose.models.Media || mongoose.model('Media', MediaSchema);
