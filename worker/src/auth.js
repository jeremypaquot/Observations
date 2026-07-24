const encoder = new TextEncoder();
const COOKIE_NAME = "observations_session";

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function signature(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

export async function safeEqual(left, right) {
  const leftHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(left)));
  const rightHash = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(right)));
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) difference |= leftHash[index] ^ rightHash[index];
  return difference === 0;
}

export async function createSession(env) {
  const expiresAt = Math.floor(Date.now() / 1000) + Number(env.SESSION_TTL_SECONDS || 604800);
  const nonce = crypto.randomUUID();
  const payload = `${expiresAt}.${nonce}`;
  return `${payload}.${await signature(payload, env.SESSION_SECRET)}`;
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  for (const cookie of cookies.split(";")) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

export async function hasValidSession(request, env) {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;
  const [expiresAt, nonce, suppliedSignature] = token.split(".");
  if (!expiresAt || !nonce || !suppliedSignature || Number(expiresAt) <= Date.now() / 1000) return false;
  const expected = await signature(`${expiresAt}.${nonce}`, env.SESSION_SECRET);
  return safeEqual(suppliedSignature, expected);
}

export function sessionCookie(token, env) {
  const maxAge = Number(env.SESSION_TTL_SECONDS || 604800);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=None; Partitioned; Path=/; Max-Age=${maxAge}`;
}

export function expiredSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=None; Partitioned; Path=/; Max-Age=0`;
}
