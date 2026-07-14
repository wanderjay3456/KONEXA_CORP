import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export const GOOGLE_WORKSPACE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/chat.spaces",
  "https://www.googleapis.com/auth/chat.messages",
  "https://www.googleapis.com/auth/chat.memberships",
  "https://www.googleapis.com/auth/meetings.space.created",
  "https://www.googleapis.com/auth/meetings.space.readonly",
];

let cachedAccessToken: string | null = null;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void,
) => {
  const syncSession = async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    cachedAccessToken = session?.provider_token || null;
    if (session?.user && cachedAccessToken) onAuthSuccess?.(session.user, cachedAccessToken);
    else onAuthFailure?.();
  };

  void syncSession();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cachedAccessToken = session?.provider_token || null;
    if (session?.user && cachedAccessToken) onAuthSuccess?.(session.user, cachedAccessToken);
    else onAuthFailure?.();
  });
  return () => data.subscription.unsubscribe();
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: GOOGLE_WORKSPACE_SCOPES.join(" "),
      redirectTo: window.location.origin,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
  if (error) throw error;
  return null;
};

export const getAccessToken = async () => cachedAccessToken;

export const googleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  cachedAccessToken = null;
};
