export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

export function error(message, status = 400) {
  return json({ error: message }, status);
}

export function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = [env.ALLOWED_ORIGIN, "http://localhost:8080", "http://127.0.0.1:8080"].filter(Boolean);
  return origin && allowed.includes(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        Vary: "Origin",
      }
    : {};
}
