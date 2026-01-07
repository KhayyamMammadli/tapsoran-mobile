import { api } from "./api";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Retry GET for flaky networks / cold starts (Render free tier, etc.).
 * Throws the last error if all retries fail.
 */
export async function retryGet<T = any>(
  url: string,
  opts?: {
    retries?: number;
    baseDelayMs?: number;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeoutMs?: number;
  }
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const baseDelayMs = opts?.baseDelayMs ?? 1200;

  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await api.get(url, {
        params: opts?.params,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...(opts?.headers || {}),
        },
        timeout: opts?.timeoutMs,
      });
      return res.data as T;
    } catch (e: any) {
      lastErr = e;
      if (attempt >= retries) break;
      const delay = baseDelayMs * (2 ** attempt);
      await sleep(delay);
    }
  }

  throw lastErr;
}
