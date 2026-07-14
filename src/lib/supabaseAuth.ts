import type { User } from "@supabase/supabase-js";
import { db, supabase } from "../config/supabase";

let cachedUser: User | null = null;
let readyPromise: Promise<void> | null = null;

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

export async function signInWithPopup(_auth: unknown, _provider: GoogleAuthProvider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window === "undefined" ? undefined : window.location.origin },
  });
  if (error) throw error;
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
