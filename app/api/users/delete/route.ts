import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/user';
import Post from '@/models/post';
import Reel from '@/models/reel';
import Story from '@/models/story';
import Comment from '@/models/comment';
import Message from '@/models/message';
import Conversation from '@/models/conversation';
import Bookmark from '@/models/bookmark';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();

    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId || decoded.id;

    // Get password from request body
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }

    // Delete all user's content
    console.log(`Deleting all content for user: ${userId}`);

    // Delete user's posts
    await Post.deleteMany({ user_id: userId });
    console.log('Posts deleted');

    // Delete user's reels
    await Reel.deleteMany({ user_id: userId });
    console.log('Reels deleted');

    // Delete user's stories
    await Story.deleteMany({ user_id: userId });
    console.log('Stories deleted');

    // Delete user's comments
    await Comment.deleteMany({ user_id: userId });
    console.log('Comments deleted');

    // Delete user's bookmarks
    await Bookmark.deleteMany({ user_id: userId });
    console.log('Bookmarks deleted');

    // Delete conversations where user is a participant
    const conversations = await Conversation.find({
      participants: userId
    });

    for (const conversation of conversations) {
      // Delete all messages in the conversation
      await Message.deleteMany({ conversation_id: conversation._id });
      
      // Delete the conversation
      await Conversation.findByIdAndDelete(conversation._id);
    }
    console.log('Conversations and messages deleted');

    // Remove user from other users' followers/following lists
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    console.log('Follower/following relationships removed');

    // Finally, delete the user account
    await User.findByIdAndDelete(userId);
    console.log('User account deleted');

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to delete account' 
      },
      { status: 500 }
    );
  }
}
