import { Request, Response } from 'express';
import Story from '../models/story';
import User from '../models/user';
import { AuthRequest } from '../middleware/auth';

// Create a new story
export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { caption } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    
    // Determine media type based on mimetype
    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Create new story
    const newStory = new Story({
      user: userId,
      media_url: `/uploads/stories/${file.filename}`,
      media_type: mediaType,
      caption: caption || '',
      expires_at: expiresAt,
      created_at: new Date()
    });
    
    await newStory.save();
    
    res.status(201).json({ 
      message: 'Story created successfully',
      story: newStory
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get active stories from users the current user follows
export const getFollowingStories = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Get user's following list
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find active stories from users that the current user follows
    const stories = await Story.find({
      user: { $in: user.following },
      expires_at: { $gt: new Date() }
    })
    .sort({ created_at: -1 })
    .populate('user', 'username full_name avatar_url');
    
    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});
    
    res.status(200).json({
      stories: Object.values(storiesByUser)
    });
  } catch (error) {
    console.error('Get following stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's active stories
export const getUserStories = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const stories = await Story.find({
      user: userId,
      expires_at: { $gt: new Date() }
    })
    .sort({ created_at: -1 })
    .populate('user', 'username full_name avatar_url');
    
    res.status(200).json({ stories });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// View a story (add user to views)
export const viewStory = async (req: AuthRequest, res: Response) => {
  try {
    const viewerId = req.userId;
    const { storyId } = req.params;
    
    const story = await Story.findById(storyId);
    
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    // Check if story has expired
    if (story.expires_at < new Date()) {
      return res.status(400).json({ message: 'Story has expired' });
    }
    
    // Check if user already viewed the story
    if (!story.views.includes(viewerId)) {
      story.views.push(viewerId);
      await story.save();
    }
    
    res.status(200).json({ 
      message: 'Story viewed',
      viewsCount: story.views.length
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createStory,
  getFollowingStories,
  getUserStories,
  viewStory
};