import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { APIContext } from "astro";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-key";
const API_KEY = process.env.API_KEY || "default-api-key";

export interface User {
  id: string;
  username: string;
  role: "admin" | "editor";
}

export interface AuthToken {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Simple in-memory user storage for demonstration
// In production, this would be stored in a database
const users: Record<string, { password: string; role: "admin" | "editor" }> = {
  admin: {
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewNhBzHG0ZVFh.6O", // 'admin123'
    role: "admin",
  },
};

export class AuthService {
  static generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );
  }

  static verifyToken(token: string): AuthToken | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthToken;
    } catch {
      return null;
    }
  }

  static async authenticateUser(
    username: string,
    password: string,
  ): Promise<User | null> {
    const user = users[username];
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;

    return {
      id: username,
      username,
      role: user.role,
    };
  }

  static verifyApiKey(apiKey: string): boolean {
    return apiKey === API_KEY;
  }

  static getTokenFromRequest(context: APIContext): AuthToken | null {
    // Try cookie first
    const cookieToken = context.cookies.get("auth-token");
    if (cookieToken) {
      const token = this.verifyToken(cookieToken.value);
      if (token) return token;
    }

    // Try Authorization header
    const authHeader = context.request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      return this.verifyToken(token);
    }

    return null;
  }

  static requireAuth(context: APIContext): AuthToken {
    const token = this.getTokenFromRequest(context);
    if (!token) {
      throw new Response("Unauthorized", { status: 401 });
    }
    return token;
  }

  static requireApiKey(context: APIContext): void {
    const apiKey =
      context.request.headers.get("X-API-Key") ||
      context.url.searchParams.get("apiKey");

    if (!apiKey || !this.verifyApiKey(apiKey)) {
      throw new Response("Unauthorized", { status: 401 });
    }
  }

  static requireAdminAuth(context: APIContext): AuthToken {
    const token = this.requireAuth(context);
    if (token.role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    return token;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
