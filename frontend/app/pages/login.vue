<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' });

const { login } = useAuth();
const route = useRoute();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  error.value = '';
  loading.value = true;
  try {
    await login(email.value, password.value);
    const redirect = (route.query.redirect as string) || '/dashboard';
    await navigateTo(redirect);
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    error.value = Array.isArray(msg) ? msg[0] : msg || 'Autentificare eșuată. Încearcă din nou.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Bine ai revenit</h1>
    <p class="mt-2 text-sm text-slate-500">
      Nu ai cont?
      <NuxtLink to="/register" class="font-semibold text-brand-600 hover:text-brand-700">
        Creează unul gratuit
      </NuxtLink>
    </p>

    <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>

    <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
      <UiInput
        v-model="email"
        label="Email"
        type="email"
        icon="lucide:mail"
        placeholder="nume@exemplu.com"
        autocomplete="email"
        required
      />
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <label class="text-sm font-medium text-slate-700">Parolă</label>
          <NuxtLink
            to="/forgot-password"
            class="text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            Ai uitat parola?
          </NuxtLink>
        </div>
        <UiInput
          v-model="password"
          type="password"
          icon="lucide:lock"
          placeholder="••••••••"
          autocomplete="current-password"
          required
        />
      </div>

      <UiButton type="submit" size="lg" block :loading="loading">Autentificare</UiButton>
    </form>
  </div>
</template>
