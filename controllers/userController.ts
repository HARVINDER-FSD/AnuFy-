import { Request, Response } from 'express';
import User from '../models/user';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import mongoose from 'mongoose';

// Get user profile
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile by username
export const getUserByUsername = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    // Find user by username
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user by username error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { username, full_name, bio, date_of_birth } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if username is taken (if changing username)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }
    
    // Update user fields
    if (username) user.username = username;
    if (full_name) user.full_name = full_name;
    if (bio !== undefined) user.bio = bio;
    if (date_of_birth) user.date_of_birth = new Date(date_of_birth);
    
    user.updated_at = new Date();
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update profile picture
export const updateProfilePicture = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { profile_picture } = req.body;
    
    if (!profile_picture) {
      return res.status(400).json({ message: 'Profile picture URL is required' });
    }
    
    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { profile_picture },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ 
      message: 'Profile picture updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update profile picture error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
    
// Get user followers
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('followers', 'username full_name profile_picture')
      .select('followers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ followers: user.followers });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users that the user is following
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('following', 'username full_name profile_picture')
      .select('following');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ following: user.following });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;
    
    // Check if trying to follow self
    if (currentUserId === userId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Check if already following
    if (currentUser.following.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(400).json({ message: 'Already following this user' });
    }
    
    // Add to following
    currentUser.following.push(new mongoose.Types.ObjectId(userId));
    await currentUser.save();
    
    // Add to followers
    userToFollow.followers.push(new mongoose.Types.ObjectId(currentUserId));
    await userToFollow.save();
    
    res.status(200).json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const { userId } = req.params;
    
    // Check if trying to unfollow self
    if (currentUserId === userId) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }
    
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'Current user not found' });
    }
    
    // Check if not following
    if (!currentUser.following.includes(new mongoose.Types.ObjectId(userId))) {
      return res.status(400).json({ message: 'Not following this user' });
    }
    
    // Remove from following
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== userId
    );
    await currentUser.save();
    
    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== currentUserId
    );
    await userToUnfollow.save();
    
    res.status(200).json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// All functions are already exported individually above