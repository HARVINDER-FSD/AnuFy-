import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Report from '@/models/report';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

export const dynamic = 'force-dynamic';

// Create a report
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
    const { reported_user_id, content_id, content_type, reason, description } = body;
    
    if (!reason) {
      return NextResponse.json(
        { message: 'Reason is required' },
        { status: 400 }
      );
    }
    
    // Create report
    const report = await Report.create({
      reporter_id: new mongoose.Types.ObjectId(userId),
      reported_user_id: reported_user_id ? new mongoose.Types.ObjectId(reported_user_id) : undefined,
      content_id: content_id ? new mongoose.Types.ObjectId(content_id) : undefined,
      content_type,
      reason,
      description: description?.substring(0, 500),
      status: 'pending'
    });
    
    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      report_id: report._id.toString()
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get reports (admin only)
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
    
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    
    // Get reports with user info
    const reports = await Report.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Report.countDocuments(query);
    
    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
