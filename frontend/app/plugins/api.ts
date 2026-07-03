import type { FetchOptions } from 'ofetch';

/**
 * Client HTTP central. Atașează automat access token-ul și, la 401, încearcă
 * o singură dată refresh + retry (cu rotația refresh token-ului din backend).
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase as string;

  const accessToken = useCookie<string | null>('access_token', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
  const refreshToken = useCookie<string | null>('refresh_token', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  const raw = $fetch.create({ baseURL });
  let refreshing: Promise<boolean> | null = null;

  async function doRefresh(): Promise<boolean> {
    if (!refreshToken.value) return false;
    try {
      const res = await raw<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${refreshToken.value}` },
      });
      accessToken.value = res.accessToken;
      refreshToken.value = res.refreshToken;
      return true;
    } catch {
      accessToken.value = null;
      refreshToken.value = null;
      return false;
    }
  }

  const withAuth = (opts: FetchOptions, token: string | null): FetchOptions => ({
    ...opts,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> | undefined),
    },
  });

  async function api<T>(request: string, opts: FetchOptions = {}): Promise<T> {
    try {
      return await raw<T>(request, withAuth(opts, accessToken.value) as never);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 && refreshToken.value) {
        refreshing ??= doRefresh().finally(() => {
          refreshing = null;
        });
        const ok = await refreshing;
        if (ok) {
          return await raw<T>(request, withAuth(opts, accessToken.value) as never);
        }
      }
      throw err;
    }
  }

  return { provide: { api } };
});
