import { Request, Response } from 'express';
import User from '../models/user';
import Post from '../models/post';
import { AuthRequest } from '../middleware/auth';

// Search users
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { full_name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('username full_name avatar_url bio is_verified')
    .skip(skip)
    .limit(limit);
    
    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { full_name: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search posts by tags or caption
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const posts = await Post.find({
      $or: [
        { caption: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query as string, 'i')] } }
      ]
    })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'username full_name avatar_url');
    
    const total = await Post.countDocuments({
      $or: [
        { caption: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query as string, 'i')] } }
      ]
    });
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get explore posts (popular posts)
export const getExplorePosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 15;
    const skip = (page - 1) * limit;
    
    // Get posts with most likes
    const posts = await Post.find()
      .sort({ 'likes.length': -1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username full_name avatar_url');
    
    const total = await Post.countDocuments();
    
    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get explore posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {
  searchUsers,
  searchPosts,
  getExplorePosts
};