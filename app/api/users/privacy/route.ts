import { NextRequest, NextResponse } from "next/server"
import { UserService } from "@/services/user"
import { verifyAuth } from "@/lib/auth"


export const dynamic = 'force-dynamic';

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
    
    // Update user privacy setting
    const updatedUser = await UserService.updateProfile(userId, { is_private });
    
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("Privacy update error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update privacy settings" },
      { status: error.status || 500 }
    );
  }
}