import { Request, Response } from 'express';
import Post from '../models/post';
import User from '../models/user';
import { AuthRequest } from '../middleware/auth';

// Create a new post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { caption, location, tags } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: 'Media file is required' });
    }
    
    // Determine media type based on mimetype
    const mediaType = file.mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Create new post
    const newPost = new Post({
      user: userId,
      caption: caption || '',
      media_url: `/uploads/posts/${file.filename}`,
      media_type: mediaType,
      location: location || '',
      tags: tags ? JSON.parse(tags) : [],
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await newPost.save();
    
    // Increment user's posts count
    await User.findByIdAndUpdate(userId, { $inc: { posts_count: 1 } });
    
    res.status(201).json({ 
      message: 'Post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user posts
export const getUserPosts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find({ user: userId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username full_name avatar_url');
    
    const total = await Post.countDocuments({ user: userId });
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get feed posts (posts from users the current user follows)
export const getFeedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Get user's following list
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find posts from users that the current user follows
    const posts = await Post.find({ user: { $in: user.following } })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username full_name avatar_url');
    
    const total = await Post.countDocuments({ user: { $in: user.following } });
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get feed posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single post by ID
export const getPostById = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    
    const post = await Post.findById(postId)
      .populate('user', 'username full_name avatar_url');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.status(200).json({ post });
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Like a post
export const likePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user already liked the post
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: 'Post already liked' });
    }
    
    // Add user to likes array
    post.likes.push(userId);
    await post.save();
    
    res.status(200).json({ 
      message: 'Post liked successfully',
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unlike a post
export const unlikePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user has liked the post
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: 'Post not liked yet' });
    }
    
    // Remove user from likes array
    post.likes = post.likes.filter(id => id.toString() !== userId.toString());
    await post.save();
    
    res.status(200).json({ 
      message: 'Post unliked successfully',
      likesCount: post.likes.length
    });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  createPost,
  getUserPosts,
  getFeedPosts,
  getPostById,
  likePost,
  unlikePost
};