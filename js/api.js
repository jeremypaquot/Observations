import { APP_CONFIG } from "./config.js";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const response = await fetch(`${APP_CONFIG.apiBaseUrl}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || "Une erreur est survenue.", response.status);
  return data;
}
