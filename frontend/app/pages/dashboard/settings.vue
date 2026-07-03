<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

interface Session {
  id: string;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

const { $api } = useNuxtApp();
const { logout } = useAuth();
const refreshToken = useCookie<string | null>('refresh_token');

/* ------------------------------- Sessions -------------------------------- */
const { data: sessions, refresh: refreshSessions } = await useAsyncData('sessions', () =>
  $api<Session[]>('/auth/sessions').catch(() => [] as Session[]),
);

const currentJti = computed(() => {
  const t = refreshToken.value;
  if (!t) return null;
  try {
    const b = t.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(b)) as { jti?: string }).jti ?? null;
  } catch {
    return null;
  }
});

function uaLabel(ua: string | null) {
  if (!ua) return 'Dispozitiv necunoscut';
  const browser = /Edg/.test(ua)
    ? 'Edge'
    : /Chrome/.test(ua)
      ? 'Chrome'
      : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return `${browser}${os ? ' · ' + os : ''}`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

const sessionBusy = ref('');
async function revokeSession(id: string) {
  sessionBusy.value = id;
  try {
    await $api(`/auth/sessions/${id}`, { method: 'DELETE' });
    await refreshSessions();
  } finally {
    sessionBusy.value = '';
  }
}
const loggingOutOthers = ref(false);
async function logoutOthers() {
  loggingOutOthers.value = true;
  try {
    await $api('/auth/logout-others', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshToken.value}` },
    });
    await refreshSessions();
  } finally {
    loggingOutOthers.value = false;
  }
}

/* --------------------------- Change password ----------------------------- */
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const pwLoading = ref(false);
const pwError = ref('');
const pwSuccess = ref(false);

async function changePassword() {
  pwError.value = '';
  pwSuccess.value = false;
  if (newPassword.value.length < 8) {
    pwError.value = 'Parola nouă trebuie să aibă minim 8 caractere.';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    pwError.value = 'Parolele noi nu coincid.';
    return;
  }
  pwLoading.value = true;
  try {
    await $api('/auth/password/change', {
      method: 'POST',
      body: { currentPassword: currentPassword.value, newPassword: newPassword.value },
    });
    pwSuccess.value = true;
    currentPassword.value = newPassword.value = confirmPassword.value = '';
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    pwError.value = Array.isArray(msg) ? msg[0]! : msg || 'Schimbarea parolei a eșuat.';
  } finally {
    pwLoading.value = false;
  }
}

/* ---------------------------- Delete account ----------------------------- */
const showDelete = ref(false);
const delPassword = ref('');
const delLoading = ref(false);
const delError = ref('');

async function deleteAccount() {
  delError.value = '';
  delLoading.value = true;
  try {
    await $api('/auth/account/delete', { method: 'POST', body: { password: delPassword.value } });
    await logout();
    await navigateTo('/');
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    delError.value = msg || 'Ștergerea contului a eșuat.';
  } finally {
    delLoading.value = false;
  }
}
</script>

<template>
  <div class="container-page max-w-2xl py-10">
    <NuxtLink to="/dashboard" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Dashboard
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Setări cont</h1>

    <!-- Schimbare parolă -->
    <section class="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 class="text-lg font-semibold text-ink">Schimbă parola</h2>
      <UiAlert v-if="pwError" variant="error" class="mt-4">{{ pwError }}</UiAlert>
      <UiAlert v-else-if="pwSuccess" variant="success" class="mt-4">Parola a fost schimbată.</UiAlert>
      <form class="mt-4 space-y-4" @submit.prevent="changePassword">
        <UiInput v-model="currentPassword" label="Parola curentă" type="password" icon="lucide:lock" autocomplete="current-password" required />
        <UiInput v-model="newPassword" label="Parola nouă" type="password" icon="lucide:lock" placeholder="Minim 8 caractere" autocomplete="new-password" required />
        <UiInput v-model="confirmPassword" label="Confirmă parola nouă" type="password" icon="lucide:lock" autocomplete="new-password" required />
        <UiButton type="submit" :loading="pwLoading">Salvează parola</UiButton>
      </form>
    </section>

    <!-- Sesiuni active -->
    <section class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-ink">Sesiuni active</h2>
        <button
          v-if="(sessions?.length ?? 0) > 1"
          class="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
          :disabled="loggingOutOthers"
          @click="logoutOthers"
        >
          {{ loggingOutOthers ? 'Se procesează…' : 'Deconectează celelalte dispozitive' }}
        </button>
      </div>
      <p class="mt-1 text-sm text-body">Dispozitivele pe care ești autentificat.</p>

      <div class="mt-4 divide-y divide-slate-100">
        <div v-for="s in sessions" :key="s.id" class="flex items-center gap-3 py-3">
          <Icon name="lucide:monitor" class="size-5 shrink-0 text-slate-400" />
          <div class="min-w-0 flex-1">
            <p class="flex flex-wrap items-center gap-2 font-medium text-ink">
              {{ uaLabel(s.userAgent) }}
              <span v-if="s.id === currentJti" class="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                Acest dispozitiv
              </span>
            </p>
            <p class="text-xs text-body">Autentificat pe {{ fmtDate(s.createdAt) }}</p>
          </div>
          <button
            v-if="s.id !== currentJti"
            class="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            :disabled="sessionBusy === s.id"
            @click="revokeSession(s.id)"
          >
            Revocă
          </button>
        </div>
      </div>
    </section>

    <!-- Danger zone -->
    <section class="mt-6 rounded-2xl border border-red-200 bg-red-50/40 p-6">
      <h2 class="text-lg font-semibold text-red-700">Șterge contul</h2>
      <p class="mt-1 text-sm text-body">
        Această acțiune este permanentă. Se vor șterge profilul, joburile, aplicările, conversațiile și recenziile tale.
      </p>

      <UiButton v-if="!showDelete" variant="outline" size="sm" class="mt-4 !border-red-300 !text-red-600 hover:!bg-red-50" @click="showDelete = true">
        Șterge contul
      </UiButton>

      <div v-else class="mt-4 space-y-3">
        <UiAlert v-if="delError" variant="error">{{ delError }}</UiAlert>
        <UiInput v-model="delPassword" label="Confirmă cu parola ta" type="password" icon="lucide:lock" required />
        <div class="flex gap-2">
          <UiButton size="sm" class="!bg-red-600 hover:!bg-red-700" :loading="delLoading" :disabled="!delPassword" @click="deleteAccount">
            Șterge definitiv contul
          </UiButton>
          <UiButton size="sm" variant="ghost" @click="showDelete = false">Anulează</UiButton>
        </div>
      </div>
    </section>
  </div>
</template>
