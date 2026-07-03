<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const { $api } = useNuxtApp();
const route = useRoute();

const password = ref('');
const confirm = ref('');
const loading = ref(false);
const error = ref('');
const done = ref(false);

const token = computed(() => route.query.token as string | undefined);

async function onSubmit() {
  error.value = '';
  if (password.value !== confirm.value) {
    error.value = 'Parolele nu coincid.';
    return;
  }
  if (!token.value) {
    error.value = 'Link de resetare invalid.';
    return;
  }
  loading.value = true;
  try {
    await $api('/auth/password/reset', {
      method: 'POST',
      body: { token: token.value, password: password.value },
    });
    done.value = true;
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    error.value = msg || 'Token invalid sau expirat.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <template v-if="!done">
      <h1 class="text-2xl font-bold text-ink">Setează o parolă nouă</h1>
      <p class="mt-2 text-sm text-body">Alege o parolă puternică pentru contul tău.</p>

      <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <UiInput
          v-model="password"
          label="Parolă nouă"
          type="password"
          icon="lucide:lock"
          placeholder="Minim 8 caractere"
          autocomplete="new-password"
          required
        />
        <UiInput
          v-model="confirm"
          label="Confirmă parola"
          type="password"
          icon="lucide:lock"
          placeholder="Repetă parola"
          autocomplete="new-password"
          required
        />
        <UiButton type="submit" size="lg" block :loading="loading">Resetează parola</UiButton>
      </form>
    </template>

    <div v-else class="text-center">
      <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
        <Icon name="lucide:circle-check" class="size-8 text-brand-600" />
      </span>
      <h1 class="mt-5 text-2xl font-bold text-ink">Parolă schimbată!</h1>
      <p class="mt-2 text-body">Te poți autentifica acum cu noua parolă.</p>
      <UiButton to="/login" size="lg" class="mt-6">Autentificare</UiButton>
    </div>
  </div>
</template>
