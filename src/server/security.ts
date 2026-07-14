import type { NextFunction, Request, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth, adminDb } from "./firebaseAdmin";

export type AppRole = "student" | "company" | "admin" | "ai";

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken & { role?: AppRole };
}

function sendAuthError(res: Response, status: number, message: string) {
  res.status(status).json({ error: { code: status === 401 ? "AUTH_REQUIRED" : "FORBIDDEN", message } });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    sendAuthError(res, 401, "A Firebase ID token is required.");
    return;
  }

  try {
    const token = authorization.slice("Bearer ".length).trim();
    const decoded = await adminAuth.verifyIdToken(token, true);
    const signInProvider = decoded.firebase?.sign_in_provider;

    if (signInProvider === "anonymous") {
      sendAuthError(res, 403, "A verified user account is required for this operation.");
      return;
    }
    if (decoded.email && !decoded.email_verified) {
      sendAuthError(res, 403, "Verify your email address before using protected services.");
      return;
    }

    let role = decoded.role as AppRole | undefined;
    if (!role) {
      const userSnapshot = await adminDb.collection("users").doc(decoded.uid).get();
      role = userSnapshot.data()?.role as AppRole | undefined;
    }

    req.user = { ...decoded, role };
    next();
  } catch (error) {
    console.warn("Rejected API authentication:", error instanceof Error ? error.message : error);
    sendAuthError(res, 401, "The Firebase ID token is invalid or expired.");
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
