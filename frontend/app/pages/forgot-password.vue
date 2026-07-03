<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' });

const { $api } = useNuxtApp();

const email = ref('');
const loading = ref(false);
const sent = ref(false);

async function onSubmit() {
  loading.value = true;
  try {
    await $api('/auth/password/forgot', { method: 'POST', body: { email: email.value } });
    sent.value = true;
  } catch {
    // Backend răspunde mereu 200 (anti-enumeration); afișăm succes oricum.
    sent.value = true;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <template v-if="!sent">
      <h1 class="text-2xl font-bold text-ink">Ai uitat parola?</h1>
      <p class="mt-2 text-sm text-body">
        Introdu emailul și îți trimitem un link de resetare.
      </p>

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
        <UiButton type="submit" size="lg" block :loading="loading">Trimite linkul</UiButton>
      </form>

      <NuxtLink to="/login" class="mt-6 flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
        <Icon name="lucide:arrow-left" class="size-4" /> Înapoi la autentificare
      </NuxtLink>
    </template>

    <div v-else class="text-center">
      <span class="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
        <Icon name="lucide:mail-check" class="size-8 text-brand-600" />
      </span>
      <h1 class="mt-5 text-2xl font-bold text-ink">Verifică-ți emailul</h1>
      <p class="mt-2 text-body">
        Dacă există un cont pentru <strong class="text-ink">{{ email }}</strong>,
        vei primi un link de resetare în câteva minute.
      </p>
      <UiButton to="/login" variant="outline" size="lg" class="mt-6">Înapoi la autentificare</UiButton>
    </div>
  </div>
</template>
