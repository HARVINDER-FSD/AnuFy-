import { NextRequest, NextResponse } from 'next/server';
import { queue } from '@/lib/queue';
import { cronScheduler } from '@/lib/cron';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Get job status and queue information

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (you might want to add admin role checking)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get queue status
    const queueStatus = queue.getStatus();
    const cronStatus = cronScheduler.getStatus();

    return NextResponse.json({
      queue: queueStatus,
      cron: cronStatus,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error getting job status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Manually trigger a background job
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { taskType, data, priority = 1 } = body;

    if (!taskType) {
      return NextResponse.json({ message: 'Task type is required' }, { status: 400 });
    }

    // Enqueue the task
    const taskId = await queue.enqueue(taskType, data, priority);

    return NextResponse.json({
      success: true,
      taskId,
      message: `Task ${taskType} enqueued successfully`
    });

  } catch (error: any) {
    console.error('Error triggering job:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// Control cron scheduler
export async function PATCH(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        cronScheduler.start();
        return NextResponse.json({ message: 'Cron scheduler started' });
      
      case 'stop':
        cronScheduler.stop();
        return NextResponse.json({ message: 'Cron scheduler stopped' });
      
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error controlling cron scheduler:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
