<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

const { $api } = useNuxtApp();
const { data: pages, refresh } = await useAsyncData('admin-legal', () =>
  $api<LegalPage[]>('/admin/legal').catch(() => [] as LegalPage[]),
);

const busy = ref('');
const savedSlug = ref('');

async function save(p: LegalPage) {
  busy.value = p.slug;
  savedSlug.value = '';
  try {
    await $api(`/admin/legal/${p.slug}`, {
      method: 'PATCH',
      body: { title: p.title, content: p.content },
    });
    savedSlug.value = p.slug;
    setTimeout(() => (savedSlug.value = ''), 2000);
    await refresh();
  } finally {
    busy.value = '';
  }
}
</script>

<template>
  <div class="container-page max-w-3xl py-10">
    <NuxtLink to="/admin" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Panou admin
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Pagini legale</h1>
    <p class="mt-1 text-sm text-body">Editează conținutul paginilor publice.</p>

    <div class="mt-6 space-y-6">
      <div
        v-for="p in pages"
        :key="p.slug"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Icon name="lucide:file-text" class="size-4 text-brand-600" />
            <code class="text-sm font-semibold text-ink">/{{ p.slug }}</code>
          </div>
          <NuxtLink :to="`/${p.slug}`" target="_blank" class="link text-xs">Vezi pagina ↗</NuxtLink>
        </div>

        <div class="mt-4 space-y-3">
          <UiInput v-model="p.title" label="Titlu" />
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Conținut</label>
            <UiRichText v-model="p.content" full :height="360" />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <UiButton size="sm" :loading="busy === p.slug" @click="save(p)">Salvează</UiButton>
          <span v-if="savedSlug === p.slug" class="text-sm font-medium text-brand-600">Salvat ✓</span>
        </div>
      </div>
    </div>
  </div>
</template>
