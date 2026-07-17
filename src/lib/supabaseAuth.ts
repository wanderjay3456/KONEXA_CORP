import type { User } from "@supabase/supabase-js";
import { db, supabase } from "../config/supabase";

let cachedUser: User | null = null;
let readyPromise: Promise<void> | null = null;
const GOOGLE_AUTH_INTENT_KEY = "konexa_google_auth_intent";
const GOOGLE_REGISTRATION_PARAM = "konexa_registration";

export interface GoogleAuthIntent {
  mode: "login" | "register";
  role: "student" | "company" | "admin";
  consentBundle?: Record<string, unknown>;
  profileData?: Record<string, unknown>;
  createdAt: number;
}

export function getPendingGoogleAuthIntent(): GoogleAuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(GOOGLE_AUTH_INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as GoogleAuthIntent;
    if (Date.now() - intent.createdAt > 30 * 60 * 1000) {
      window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
      return null;
    }
    return intent;
  } catch {
    window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
    return null;
  }
}

export function clearPendingGoogleAuthIntent() {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
}

export function getGoogleRegistrationId(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URL(window.location.href).searchParams.get(GOOGLE_REGISTRATION_PARAM);
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export function clearGoogleRegistrationId() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(GOOGLE_REGISTRATION_PARAM)) return;
  url.searchParams.delete(GOOGLE_REGISTRATION_PARAM);
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function userAdapter(user: User | null): any {
  if (!user) return null;
  return {
    uid: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
    emailVerified: Boolean(user.email_confirmed_at),
    isAnonymous: user.is_anonymous,
    tenantId: null,
    providerData: (user.identities || []).map((identity) => ({
      providerId: identity.provider,
      email: user.email || null,
    })),
    getIdToken: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || "";
    },
    __supabaseUser: user,
  };
}

async function initializeAuth() {
  if (!readyPromise) {
    readyPromise = supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      cachedUser = data.session?.user || null;
    });
  }
  return readyPromise;
}

export const auth = {
  get currentUser() {
    return userAdapter(cachedUser);
  },
  authStateReady: initializeAuth,
  onAuthStateChanged(callback: (user: any) => void) {
    let active = true;
    void initializeAuth().then(() => active && callback(userAdapter(cachedUser)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user || null;
      if (active) callback(userAdapter(cachedUser));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    cachedUser = null;
  },
};

export class GoogleAuthProvider {}

export async function createUserWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string,
  metadata: Record<string, unknown> = {},
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin,
    },
  });
  if (error) throw error;
  cachedUser = data.user;
  return { user: userAdapter(data.user), session: data.session };
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  cachedUser = data.user;
  return { user: userAdapter(data.user), session: data.session };
}

export async function signOut(_auth: unknown) {
  await auth.signOut();
}

export async function signInAnonymously(_auth?: unknown) {
  return { user: null };
}

export async function signInWithPopup(
  _auth: unknown,
  _provider: GoogleAuthProvider,
  intent: Omit<GoogleAuthIntent, "createdAt">,
) {
  let redirectTo = typeof window === "undefined" ? undefined : window.location.origin;
  if (intent.mode === "register") {
    const { data: registrationId, error: registrationError } = await supabase.rpc("begin_google_registration", {
      requested_role: intent.role,
      consent_payload: (intent.consentBundle || {}) as any,
      profile_payload: (intent.profileData || {}) as any,
    });
    if (registrationError || !registrationId) throw registrationError || new Error("Google registration could not be initialized");
    if (typeof window !== "undefined") {
      const callback = new URL(window.location.origin);
      callback.searchParams.set(GOOGLE_REGISTRATION_PARAM, String(registrationId));
      redirectTo = callback.toString();
    }
  } else {
    clearPendingGoogleAuthIntent();
    if (intent.role === "admin" && typeof window !== "undefined") {
      window.sessionStorage.setItem(
        GOOGLE_AUTH_INTENT_KEY,
        JSON.stringify({ ...intent, createdAt: Date.now() }),
      );
    }
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) {
    clearPendingGoogleAuthIntent();
    throw error;
  }
  return { user: auth.currentUser, provider: data.provider };
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
export async function sendPasswordResetEmail(_auth: unknown, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window === "undefined" ? undefined : window.location.origin,
  });
  if (error) throw error;
}

export { db, supabase };
