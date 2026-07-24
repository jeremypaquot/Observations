import { createSession, expiredSessionCookie, hasValidSession, safeEqual, sessionCookie } from "./auth.js";
import { insertObservation, listObservations, listReference } from "./database.js";
import { corsHeaders, error, json } from "./responses.js";
import { validateObservation } from "./validation.js";

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (path === "/login" && request.method === "POST") {
    if (!env.APP_PASSWORD || !env.SESSION_SECRET) return error("Configuration serveur incomplète.", 500);
    const body = await request.json().catch(() => ({}));
    if (typeof body.password !== "string" || !(await safeEqual(body.password, env.APP_PASSWORD))) {
      return error("Mot de passe incorrect.", 401);
    }
    const token = await createSession(env);
    return json({ authenticated: true }, 200, { "Set-Cookie": sessionCookie(token, env) });
  }

  if (!(await hasValidSession(request, env))) return error("Authentification requise.", 401);

  if (path === "/session" && request.method === "GET") return json({ authenticated: true });
  if (path === "/logout" && request.method === "POST") {
    return json({ authenticated: false }, 200, { "Set-Cookie": expiredSessionCookie() });
  }
  if (path === "/especes" && request.method === "GET") return json(await listReference(env.DB, "especes"));
  if (path === "/espaces" && request.method === "GET") return json(await listReference(env.DB, "espaces"));
  if (path === "/comportements" && request.method === "GET") return json(await listReference(env.DB, "comportements"));
  if (path === "/observations" && request.method === "GET") return json(await listObservations(env.DB));
  if (path === "/observations" && request.method === "POST") {
    try {
      const observation = validateObservation(await request.json());
      return json({ id: await insertObservation(env.DB, observation) }, 201);
    } catch (caught) {
      return error(caught.message, 400);
    }
  }
  return error("Route introuvable.", 404);
}

export default {
  async fetch(request, env) {
    const headers = corsHeaders(request, env);
    const origin = request.headers.get("Origin");
    if (origin && !headers["Access-Control-Allow-Origin"]) return error("Origine non autorisée.", 403);
    try {
      const response = await route(request, env);
      const finalHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([name, value]) => finalHeaders.set(name, value));
      finalHeaders.set("X-Content-Type-Options", "nosniff");
      finalHeaders.set("Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, headers: finalHeaders });
    } catch (caught) {
      console.error(caught);
      const response = error("Erreur interne du serveur.", 500);
      const finalHeaders = new Headers(response.headers);
      Object.entries(headers).forEach(([name, value]) => finalHeaders.set(name, value));
      return new Response(response.body, { status: response.status, headers: finalHeaders });
    }
  },
};
