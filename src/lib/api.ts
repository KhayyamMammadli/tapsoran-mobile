import axios from "axios";
import { API_URL } from "../config";
import { getToken } from "./authStore";

// Render free tier can be slow on cold start — keep a higher timeout.
export const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// A tiny hook so the AuthContext can react to auth-level failures (blocked/expired)
// without creating circular imports.
let authErrorHandler: ((info: { type: "BLOCKED" | "UNAUTHORIZED"; reason?: string | null; blockedAt?: string | null }) => void) | null = null;
export function setAuthErrorHandler(
  fn: ((info: { type: "BLOCKED" | "UNAUTHORIZED"; reason?: string | null; blockedAt?: string | null }) => void) | null
) {
  authErrorHandler = fn;
}

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    if (status === 403 && data?.error === "Blocked") {
      authErrorHandler?.({ type: "BLOCKED", reason: data?.reason ?? null, blockedAt: data?.blockedAt ?? null });
    } else if (status === 401 && data?.error === "Unauthorized") {
      authErrorHandler?.({ type: "UNAUTHORIZED" });
    }

    return Promise.reject(err);
  }
);
