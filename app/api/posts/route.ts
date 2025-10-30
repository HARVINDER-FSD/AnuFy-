import { NextRequest } from 'next/server';
import { proxyToAPI, requireAuth, getQueryParams, CACHE_DURATION } from '@/lib/master-routes';

export const dynamic = 'force-dynamic';

// Get all posts - Optimized with caching
export async function GET(request: NextRequest) {
  const { limit, offset } = getQueryParams(request);
  const page = Math.floor(offset / limit) + 1;
  
  return proxyToAPI(
    request,
    `/api/posts/feed?limit=${limit}&page=${page}`,
    {
      cache: true,
      cacheDuration: CACHE_DURATION.SHORT,
      timeout: 30000,
      retries: 2,
      fallback: { data: { posts: [] } }
    }
  );
}

// Create a new post
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  
  return proxyToAPI(request, '/api/posts', {
    timeout: 30000,
    retries: 1
  });
}
