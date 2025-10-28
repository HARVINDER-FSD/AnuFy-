import mongoose from 'mongoose';

// Define the story schema
const storySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media_url: {
    type: String,
    required: true
  },
  media_type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  caption: {
    type: String,
    maxlength: 500,
    default: null
  },
  location: {
    type: String,
    default: null
  },
  views_count: {
    type: Number,
    default: 0
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true
  }
});

// Index for better query performance
storySchema.index({ user_id: 1, created_at: -1 });
storySchema.index({ expires_at: 1 });
storySchema.index({ created_at: -1 });

// Pre-save middleware to set expiration to 24 hours from creation
storySchema.pre('save', function(next) {
  if (this.isNew && !this.expires_at) {
    this.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  next();
});

// Method to check if story is expired
storySchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

// Method to increment view count
storySchema.methods.incrementViews = function() {
  this.views_count += 1;
  return this.save();
};

// Create the model if it doesn't exist or get it if it does
const Story = mongoose.models.Story || mongoose.model('Story', storySchema);

export default Story;
