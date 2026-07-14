import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

// Define the scopes requested for Google Chat and Google Meet
export const GOOGLE_WORKSPACE_SCOPES = [
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/chat.users.spacesettings",
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
  "https://www.googleapis.com/auth/meetings.space.settings"
];

const provider = new GoogleAuthProvider();
GOOGLE_WORKSPACE_SCOPES.forEach(scope => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUserProfile: User | null = null;

// Initialize Google OAuth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentUserProfile = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      currentUserProfile = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google OAuth Sign-In with Chat Scopes
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve Google OAuth access token.");
    }

    cachedAccessToken = credential.accessToken;
    currentUserProfile = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Workspace Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  currentUserProfile = null;
};
