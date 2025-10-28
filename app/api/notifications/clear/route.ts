import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function DELETE(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = decoded.userId;

    // Connect to database
    const db = await connectDB();
    const notificationsCollection = db.collection('notifications');

    // Delete all notifications for this user
    const result = await notificationsCollection.deleteMany({
      recipient_id: userId
    });

    console.log(`Deleted ${result.deletedCount} notifications for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications', details: error.message },
      { status: 500 }
    );
  }
}
