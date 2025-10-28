import { jwtVerify } from "jose";

/**
 * Verify JWT token
 */
export async function verifyJwtToken(token: string) {
  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'jnnkdajjsnfknaskfn');
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.userId as string,
      username: payload.username as string,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}