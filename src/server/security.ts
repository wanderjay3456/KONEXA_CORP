import type { NextFunction, Request, Response } from "express";
import { getSupabaseAuthClient } from "./supabaseAdmin";

export type AppRole = "student" | "company" | "admin" | "ai";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  email_verified: boolean;
  role?: AppRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

function sendAuthError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { code: status === 401 ? "AUTH_REQUIRED" : "FORBIDDEN", message } });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    sendAuthError(res, 401, "A Supabase access token is required.");
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const client = getSupabaseAuthClient(token);
    const { data: userResult, error: userError } = await client.auth.getUser(token);
    if (userError || !userResult.user) throw userError || new Error("User not found");

    const user = userResult.user;
    if (!user.email_confirmed_at) {
      sendAuthError(res, 403, "Verify your email address before using protected services.");
      return;
    }

    const { data: profileRecord, error: profileError } = await client
      .from("app_records")
      .select("data")
      .eq("collection_name", "users")
      .eq("record_id", user.id)
      .single();
    if (profileError) throw profileError;

    const profile = profileRecord.data as Record<string, any>;
    req.user = {
      uid: user.id,
      email: user.email,
      name: profile.displayName || user.user_metadata?.display_name,
      email_verified: Boolean(user.email_confirmed_at),
      role: profile.role as AppRole,
    };
    next();
  } catch (error) {
    console.warn("Rejected API authentication:", error instanceof Error ? error.message : error);
    sendAuthError(res, 401, "The Supabase access token is invalid or expired.");
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      sendAuthError(res, 403, `One of these roles is required: ${roles.join(", ")}.`);
      return;
    }
    next();
  };
}
