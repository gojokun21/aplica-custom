<script setup lang="ts">
interface LegalPage { slug: string; title: string; content: string; updatedAt: string }
const { $api } = useNuxtApp();
const { data: page } = await useAsyncData('legal-privacy', () =>
  $api<LegalPage>('/legal/privacy').catch(() => null),
);
useSeoMeta({ title: () => page.value?.title || 'Politica de confidențialitate' });
</script>

<template>
  <div class="container-page max-w-3xl py-12">
    <h1 class="text-3xl font-bold text-ink">{{ page?.title || 'Politica de confidențialitate' }}</h1>
    <p v-if="page" class="mt-1 text-sm text-body">
      Actualizat: {{ new Date(page.updatedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }) }}
    </p>
    <div class="rich mt-6" v-html="page?.content" />
  </div>
</template>
