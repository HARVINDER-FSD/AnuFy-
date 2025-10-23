import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Get analytics data
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'user';
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'daily';
    const contentType = searchParams.get('contentType') as 'posts' | 'stories' | 'reels' || 'posts';

    let analytics;

    switch (type) {
      case 'user':
        analytics = await analyticsService.getUserAnalytics(decoded.userId, period);
        break;
      case 'platform':
        analytics = await analyticsService.getPlatformAnalytics(period);
        break;
      case 'content':
        analytics = await analyticsService.getContentPerformance(decoded.userId, contentType);
        break;
      case 'trending':
        const trendingType = searchParams.get('trendingType') as 'posts' | 'reels' || 'posts';
        const limit = parseInt(searchParams.get('limit') || '10');
        analytics = await analyticsService.getTrendingContent(trendingType, limit);
        break;
      default:
        return NextResponse.json({ message: 'Invalid analytics type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
