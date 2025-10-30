import { NextRequest, NextResponse } from 'next/server';
import { proxyToAPI, CACHE_DURATION } from '@/lib/master-routes';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('q');
  
  if (!searchQuery) {
    return NextResponse.json(
      { message: 'Search query is required' },
      { status: 400 }
    );
  }
  
  return proxyToAPI(
    request,
    `/api/search?q=${encodeURIComponent(searchQuery)}`,
    {
      cache: true,
      cacheDuration: CACHE_DURATION.MEDIUM,
      timeout: 15000,
      retries: 2,
      fallback: { users: [], posts: [], hashtags: [] }
    }
  );
}
