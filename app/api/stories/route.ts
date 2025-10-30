import { NextRequest } from 'next/server';
import { proxyToAPI, requireAuth, CACHE_DURATION } from '@/lib/master-routes';

export const dynamic = 'force-dynamic';

// Get all stories - Optimized with caching and fallback
export async function GET(request: NextRequest) {
  return proxyToAPI(
    request,
    '/api/stories',
    {
      cache: true,
      cacheDuration: CACHE_DURATION.SHORT,
      timeout: 30000,
      retries: 2,
      fallback: []
    }
  );
}

// Create a new story
export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;
  
  return proxyToAPI(request, '/api/stories', {
    timeout: 30000,
    retries: 1
  });
}
