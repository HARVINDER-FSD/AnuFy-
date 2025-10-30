import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    // Get user from token
    const authResult = await verifyAuth(req);
    
    if (!authResult.success) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    
    const userId = authResult.userId;
    const { is_private } = await req.json();
    
    if (typeof is_private !== 'boolean') {
      return NextResponse.json({ message: "Invalid privacy setting" }, { status: 400 });
    }
    
    // Get token from request
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    
    // Update user privacy setting via API server
    const response = await fetch(`${API_URL}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ is_private })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { message: error.message || "Failed to update privacy settings" },
        { status: response.status }
      );
    }
    
    const updatedUser = await response.json();
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Privacy update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}