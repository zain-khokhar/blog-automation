import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: Object, // Store TipTap JSON
    required: true,
  },
  htmlContent: {
    type: String, // Cached HTML version
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled'],
    default: 'draft',
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  metaTitle: {
    type: String,
    maxlength: 60,
  },
  metaDescription: {
    type: String,
    maxlength: 160,
  },
  focusKeyword: {
    type: String,
  },
  seoScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  readabilityScore: {
    type: Number,
  },
  wordCount: {
    type: Number,
  },
  scheduledAt: {
    type: Date,
  },
  publishedAt: {
    type: Date,
  },
  categories: [{
    type: String,
  }],
  tags: [{
    type: String,
  }],
  featuredImage: {
    url: String,
    alt: String,
    caption: String,
  },
  author: {
    type: String,
    default: 'Admin',
  },
}, {
  timestamps: true,
});

// Create index for slug
BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema);
