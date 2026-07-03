<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const { $api } = useNuxtApp();
const route = useRoute();

const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('');

onMounted(async () => {
  const token = route.query.token as string | undefined;
  if (!token) {
    status.value = 'error';
    message.value = 'Link de verificare invalid.';
    return;
  }
  try {
    await $api('/auth/email/verify', { method: 'POST', body: { token } });
    status.value = 'success';
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    status.value = 'error';
    message.value = msg || 'Token invalid sau expirat.';
  }
});
</script>

<template>
  <div class="text-center">
    <div v-if="status === 'loading'">
      <Icon name="lucide:loader-circle" class="mx-auto size-10 animate-spin text-brand-600" />
      <p class="mt-4 text-body">Se verifică emailul…</p>
    </div>

    <div v-else-if="status === 'success'">
      <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
        <Icon name="lucide:circle-check" class="size-8 text-brand-600" />
      </span>
      <h1 class="mt-5 text-2xl font-bold text-ink">Email confirmat!</h1>
      <p class="mt-2 text-body">Contul tău este acum complet activat.</p>
      <UiButton to="/dashboard" size="lg" class="mt-6">Mergi la dashboard</UiButton>
    </div>

    <div v-else>
      <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50">
        <Icon name="lucide:circle-x" class="size-8 text-red-600" />
      </span>
      <h1 class="mt-5 text-2xl font-bold text-ink">Verificare eșuată</h1>
      <p class="mt-2 text-body">{{ message }}</p>
      <UiButton to="/dashboard" variant="outline" size="lg" class="mt-6">Înapoi la cont</UiButton>
    </div>
  </div>
</template>
