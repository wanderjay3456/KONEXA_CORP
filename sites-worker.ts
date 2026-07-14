interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface SitesEnvironment {
  ASSETS: AssetFetcher;
  BACKEND_ORIGIN?: string;
}

const apiUnavailable = () => new Response(
  JSON.stringify({ error: "The secure KONEXA service is not connected yet." }),
  { status: 503, headers: { "content-type": "application/json; charset=utf-8" } },
);

export default {
  async fetch(request: Request, env: SitesEnvironment): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      if (!env.BACKEND_ORIGIN) return apiUnavailable();

      const backend = new URL(env.BACKEND_ORIGIN);
      backend.pathname = url.pathname;
      backend.search = url.search;

      const headers = new Headers(request.headers);
      headers.set("x-forwarded-host", url.host);
      headers.set("x-forwarded-proto", url.protocol.slice(0, -1));

      return fetch(new Request(backend, {
        method: request.method,
        headers,
        body: request.body,
        redirect: "manual",
      }));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404 || request.method !== "GET") return assetResponse;

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) return assetResponse;

    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
};
