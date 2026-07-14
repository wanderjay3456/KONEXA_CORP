import { auth } from "./supabaseAuth";

let installed = false;

export function installAuthenticatedApiFetch() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const requestUrl = new URL(
      input instanceof Request ? input.url : input.toString(),
      window.location.origin,
    );
    const isProtectedApi = requestUrl.origin === window.location.origin
      && requestUrl.pathname.startsWith("/api/")
      && requestUrl.pathname !== "/api/health"
      && !requestUrl.pathname.startsWith("/api/webhooks/");

    if (!isProtectedApi) return nativeFetch(input, init);

    await auth.authStateReady();
    const user = auth.currentUser;
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));

    if (user) {
      headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
    }

    return nativeFetch(input, { ...init, headers });
  };
}
