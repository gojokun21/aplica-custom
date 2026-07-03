export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'FREELANCER';
}

export function useAuth() {
  const { $api } = useNuxtApp();
  const accessToken = useCookie<string | null>('access_token', { sameSite: 'lax' });
  const refreshToken = useCookie<string | null>('refresh_token', { sameSite: 'lax' });
  const user = useState<AuthUser | null>('auth-user', () => null);

  const isLoggedIn = computed(() => !!user.value);
  const initials = computed(() =>
    user.value ? (user.value.firstName[0] ?? '') + (user.value.lastName[0] ?? '') : '',
  );

  function setSession(res: AuthResponse) {
    accessToken.value = res.accessToken;
    refreshToken.value = res.refreshToken;
    user.value = res.user;
  }

  async function register(payload: RegisterPayload) {
    const res = await $api<AuthResponse>('/auth/register', { method: 'POST', body: payload });
    setSession(res);
    return res;
  }

  async function login(email: string, password: string) {
    const res = await $api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    setSession(res);
    return res;
  }

  async function fetchMe() {
    try {
      user.value = await $api<AuthUser>('/auth/me');
    } catch {
      user.value = null;
    }
    return user.value;
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await $api('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${refreshToken.value}` },
        });
      }
    } catch {
      /* ignore */
    }
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
  }

  return { user, isLoggedIn, initials, register, login, logout, fetchMe };
}
