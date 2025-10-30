/**
 * Master Routes - Optimized API Route Handlers
 * High-performance route handlers with caching, error handling, and retry logic
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Cache configuration
const CACHE_DURATION = {
  SHORT: 10000,   // 10 seconds
  MEDIUM: 30000,  // 30 seconds
  LONG: 60000,    // 1 minute
};

// In-memory cache for API responses
const routeCache = new Map<string, { data: any; timestamp: number }>();

interface RouteOptions {
  timeout?: number;
  cache?: boolean;
  cacheDuration?: number;
  retries?: number;
  fallback?: any;
}

/**
 * Extract token from request
 */
export function extractToken(request: NextRequest): string | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const token = request.cookies.get('token')?.value || 
                request.cookies.get('client-token')?.value;
  
  return token || null;
}

/**
 * Create cache key
 */
function getCacheKey(url: string, token: string | null): string {
  return `${url}_${token || 'anonymous'}`;
}

/**
 * Check if cache is valid
 */
function isCacheValid(key: string, duration: number): boolean {
  const cached = routeCache.get(key);
  if (!cached) return false;
  return (Date.now() - cached.timestamp) < duration;
}

/**
 * Master proxy function with optimizations
 */
export async function proxyToAPI(
  request: NextRequest,
  endpoint: string,
  options: RouteOptions = {}
): Promise<NextResponse> {
  const {
    timeout = 30000,
    cache = false,
    cacheDuration = CACHE_DURATION.MEDIUM,
    retries = 2,
    fallback = null
  } = options;

  const token = extractToken(request);
  const method = request.method;
  const cacheKey = getCacheKey(endpoint, token);

  // Check cache for GET requests
  if (cache && method === 'GET' && isCacheValid(cacheKey, cacheDuration)) {
    console.log(`[MasterRoutes] Cache hit: ${endpoint}`);
    return NextResponse.json(routeCache.get(cacheKey)!.data);
  }

  // Execute request with retry logic
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Get request body if not GET
      let body: string | undefined;
      if (method !== 'GET' && method !== 'HEAD') {
        try {
          const bodyData = await request.json();
          body = JSON.stringify(bodyData);
        } catch {
          // No body or invalid JSON
        }
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          const error = await response.json().catch(() => ({ message: 'Client error' }));
          return NextResponse.json(error, { status: response.status });
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET requests
      if (cache && method === 'GET') {
        routeCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      // Clear related cache on mutations
      if (method !== 'GET') {
        clearRelatedCache(endpoint);
      }

      return NextResponse.json(data);

    } catch (error: any) {
      lastError = error;
      console.error(`[MasterRoutes] Attempt ${attempt + 1} failed for ${endpoint}:`, error.message);

      // Don't retry on abort (timeout)
      if (error.name === 'AbortError' && attempt === retries) {
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // All retries failed, return fallback or error
  if (fallback !== null) {
    console.log(`[MasterRoutes] Using fallback for ${endpoint}`);
    return NextResponse.json(fallback);
  }

  console.error(`[MasterRoutes] All retries failed for ${endpoint}`);
  return NextResponse.json(
    { 
      message: 'Service temporarily unavailable',
      error: lastError?.message || 'Unknown error'
    },
    { status: 503 }
  );
}

/**
 * Clear related cache entries
 */
function clearRelatedCache(endpoint: string): void {
  const baseEndpoint = endpoint.split('?')[0];
  const keys = Array.from(routeCache.keys());
  
  keys.forEach(key => {
    if (key.includes(baseEndpoint)) {
      routeCache.delete(key);
    }
  });
}

/**
 * Clear all cache
 */
export function clearAllRouteCache(): void {
  routeCache.clear();
  console.log('[MasterRoutes] All cache cleared');
}

/**
 * Validate authentication
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const token = extractToken(request);
  
  if (!token) {
    return NextResponse.json(
      { message: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Handle errors consistently
 */
export function handleError(error: any, context: string): NextResponse {
  console.error(`[MasterRoutes] Error in ${context}:`, error);
  
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  
  return NextResponse.json(
    { message, context },
    { status }
  );
}

/**
 * Parse query parameters
 */
export function getQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    offset: parseInt(searchParams.get('offset') || '0'),
    sort: searchParams.get('sort') || 'created_at',
    order: searchParams.get('order') || 'desc',
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse(
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}

// Export cache duration constants
export { CACHE_DURATION };
