<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

const { user } = useAuth();
const { $api } = useNuxtApp();

const { data: profile } = await useAsyncData('dash-profile', () =>
  $api<Record<string, unknown>>('/profiles/me').catch(() => null),
);

const resending = ref(false);
const resent = ref(false);
async function resendVerification() {
  resending.value = true;
  try {
    await $api('/auth/email/resend', { method: 'POST' });
    resent.value = true;
  } finally {
    resending.value = false;
  }
}

const roleLabel = computed(() =>
  user.value?.role === 'FREELANCER' ? 'Freelancer' : user.value?.role === 'CLIENT' ? 'Client' : 'Admin',
);
</script>

<template>
  <div class="container-page py-10">
    <!-- Verify email banner -->
    <UiAlert v-if="user && !user.emailVerifiedAt && !resent" variant="info" class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>
          Emailul tău nu este verificat. Verifică-ți inboxul sau retrimite linkul de confirmare.
        </span>
        <button
          class="shrink-0 font-semibold text-brand-700 underline underline-offset-2 disabled:opacity-60"
          :disabled="resending"
          @click="resendVerification"
        >
          {{ resending ? 'Se trimite…' : 'Retrimite emailul' }}
        </button>
      </div>
    </UiAlert>
    <UiAlert v-else-if="resent" variant="success" class="mb-6">
      Am retrimis emailul de verificare. Verifică-ți inboxul.
    </UiAlert>

    <div class="flex items-center gap-4">
      <UiAvatar
        :first-name="user?.firstName"
        :last-name="user?.lastName"
        :avatar-url="user?.avatarUrl"
        size="lg"
      />
      <div>
        <h1 class="text-2xl font-bold text-ink">
          Salut, {{ user?.firstName }} 👋
        </h1>
        <p class="text-body">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            {{ roleLabel }}
          </span>
        </p>
      </div>
    </div>

    <div class="mt-8 grid gap-5 md:grid-cols-3">
      <NuxtLink
        to="/dashboard/profile"
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
      >
        <Icon name="lucide:user-round-pen" class="size-7 text-brand-600" />
        <h3 class="mt-3 font-semibold text-ink">Editează profilul</h3>
        <p class="mt-1 text-sm text-body">Completează-ți datele pentru a ieși în evidență.</p>
      </NuxtLink>

      <NuxtLink
        :to="user?.role === 'CLIENT' ? '/talent' : '/projects'"
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-pop"
      >
        <Icon :name="user?.role === 'CLIENT' ? 'lucide:search' : 'lucide:briefcase'" class="size-7 text-brand-600" />
        <h3 class="mt-3 font-semibold text-ink">
          {{ user?.role === 'CLIENT' ? 'Găsește talente' : 'Găsește proiecte' }}
        </h3>
        <p class="mt-1 text-sm text-body">
          {{ user?.role === 'CLIENT' ? 'Caută freelanceri pentru proiectul tău.' : 'Descoperă joburi noi.' }}
        </p>
      </NuxtLink>

      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <Icon name="lucide:circle-check-big" class="size-7" :class="user?.emailVerifiedAt ? 'text-brand-600' : 'text-slate-300'" />
        <h3 class="mt-3 font-semibold text-ink">Status cont</h3>
        <p class="mt-1 text-sm text-body">
          Email {{ user?.emailVerifiedAt ? 'verificat ✓' : 'neverificat' }}
        </p>
      </div>
    </div>

    <!-- Debug profil (util în dezvoltare) -->
    <details v-if="profile" class="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
      <summary class="cursor-pointer font-medium text-ink">Date profil (API)</summary>
      <pre class="mt-3 overflow-auto text-xs text-body">{{ profile }}</pre>
    </details>
  </div>
</template>
