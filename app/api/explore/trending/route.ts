import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/api-proxy';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const limit = searchParams.get('limit') || '20';
    
    const token = getTokenFromRequest(request);
    
    // Proxy to API server
    const response = await fetch(`${API_URL}/api/explore/trending?category=${category}&limit=${limit}`, {
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
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
