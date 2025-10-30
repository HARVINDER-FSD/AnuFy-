import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import SearchHistory from '@/models/search-history';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || '4d9f1c8c6b27a67e9f3a81d2e5b0f78c72d1e7a64d59c83fb20e5a72a8c4d192';

export const dynamic = 'force-dynamic';

// Get search history
export async function GET(request: NextRequest) {
  try {
    // Get token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Get recent searches
    const history = await SearchHistory.find({
      user_id: new mongoose.Types.ObjectId(userId)
    })
    .sort({ created_at: -1 })
    .limit(limit)
    .lean();
    
    return NextResponse.json({
      history: history.map(h => ({
        id: h._id.toString(),
        query: h.query,
        type: h.type,
        created_at: h.created_at
      }))
    });
    
  } catch (error: any) {
    console.error('Error fetching search history:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add to search history
export async function POST(request: NextRequest) {
  try {
    // Get token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    await connectToDatabase();
    
    const body = await request.json();
    const { query, type } = body;
    
    if (!query) {
      return NextResponse.json(
        { message: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Check if this exact query already exists recently (last hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await SearchHistory.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      query: query,
      created_at: { $gte: oneHourAgo }
    });
    
    if (!existing) {
      // Add to history
      await SearchHistory.create({
        user_id: new mongoose.Types.ObjectId(userId),
        query,
        type: type || 'general'
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error adding to search history:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Clear search history
export async function DELETE(request: NextRequest) {
  try {
    // Get token
    const authHeader = request.headers.get('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const parts = cookies.split(';').map(c => c.trim());
        const tokenCookie = parts.find(c => c.startsWith('token=') || c.startsWith('client-token='));
        if (tokenCookie) token = tokenCookie.split('=')[1];
      }
    }
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get('id');
    
    if (historyId) {
      // Delete specific item
      await SearchHistory.deleteOne({
        _id: new mongoose.Types.ObjectId(historyId),
        user_id: new mongoose.Types.ObjectId(userId)
      });
    } else {
      // Clear all history
      await SearchHistory.deleteMany({
        user_id: new mongoose.Types.ObjectId(userId)
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Error clearing search history:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
