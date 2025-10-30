/**
 * API Proxy Utility
 * 
 * Helper functions to proxy requests from Next.js API routes to the backend API server.
 * This eliminates code duplication and provides a consistent way to handle API calls.
 */

import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Extract authentication token from request
 */
export function getTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // Try cookies
    return request.cookies.get('token')?.value ||
        request.cookies.get('client-token')?.value ||
        null;
}

/**
 * Proxy GET request to API server with timeout
 */
export async function proxyGet(
    request: NextRequest,
    endpoint: string,
    requireAuth: boolean = false,
    timeoutMs: number = 5000
): Promise<NextResponse> {
    try {
        const token = getTokenFromRequest(request);

        if (requireAuth && !token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data.data || data);

    } catch (error: any) {
        console.error(`Error proxying GET ${endpoint}:`, error);

        // Return timeout-specific error
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { message: 'Request timeout - API server not responding' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Proxy POST request to API server
 */
export async function proxyPost(
    request: NextRequest,
    endpoint: string,
    requireAuth: boolean = true
): Promise<NextResponse> {
    try {
        const token = getTokenFromRequest(request);

        if (requireAuth && !token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data.data || data, { status: response.status });

    } catch (error: any) {
        console.error(`Error proxying POST ${endpoint}:`, error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Proxy PUT request to API server
 */
export async function proxyPut(
    request: NextRequest,
    endpoint: string,
    requireAuth: boolean = true
): Promise<NextResponse> {
    try {
        const token = getTokenFromRequest(request);

        if (requireAuth && !token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data.data || data);

    } catch (error: any) {
        console.error(`Error proxying PUT ${endpoint}:`, error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Proxy DELETE request to API server
 */
export async function proxyDelete(
    request: NextRequest,
    endpoint: string,
    requireAuth: boolean = true
): Promise<NextResponse> {
    try {
        const token = getTokenFromRequest(request);

        if (requireAuth && !token) {
            return NextResponse.json(
                { message: 'Authentication required' },
                { status: 401 }
            );
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
                'Authorization': token ? `Bearer ${token}` : '',
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data.data || data);

    } catch (error: any) {
        console.error(`Error proxying DELETE ${endpoint}:`, error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Example usage:
 * 
 * // In app/api/posts/route.ts
 * import { proxyGet, proxyPost } from '@/lib/api-proxy';
 * 
 * export async function GET(request: NextRequest) {
 *   return proxyGet(request, '/api/posts/feed');
 * }
 * 
 * export async function POST(request: NextRequest) {
 *   return proxyPost(request, '/api/posts');
 * }
 */
