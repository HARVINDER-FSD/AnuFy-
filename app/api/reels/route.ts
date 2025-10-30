import { NextRequest } from 'next/server';
import { proxyToAPI, requireAuth, getQueryParams, CACHE_DURATION } from '@/lib/master-routes';

export const dynamic = 'force-dynamic';

// Get all reels - Optimized with caching
export async function GET(request: NextRequest) {
  const { page, limit } = getQueryParams(request);
  
  return proxyToAPI(
    request,
    `/api/reels?page=${page}&limit=${limit}`,
    {
      cache: true,
      cacheDuration: CACHE_DURATION.MEDIUM,
      timeout: 30000,
      retries: 2,
      fallback: { data: [] }
    }
  );
}

// Create a new reel
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  
  return proxyToAPI(request, '/api/reels', {
    timeout: 30000,
    retries: 1
  });
}
