<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface SeoEntry {
  id: string;
  path: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImageUrl: string | null;
  titleTemplate: string | null;
  noindex: boolean;
  updatedAt: string;
}

const { $api } = useNuxtApp();
const { data: entries, refresh } = await useAsyncData('admin-seo', () =>
  $api<SeoEntry[]>('/admin/seo').catch(() => [] as SeoEntry[]),
);

const busy = ref('');
const savedId = ref('');

async function save(e: SeoEntry) {
  busy.value = e.id;
  savedId.value = '';
  try {
    await $api(`/admin/seo/${e.id}`, {
      method: 'PATCH',
      body: {
        title: e.title || undefined,
        description: e.description || undefined,
        keywords: e.keywords || undefined,
        ogImageUrl: e.ogImageUrl || undefined,
        titleTemplate: e.titleTemplate || undefined,
        noindex: e.noindex,
      },
    });
    savedId.value = e.id;
    setTimeout(() => (savedId.value = ''), 2000);
  } finally {
    busy.value = '';
  }
}

async function remove(e: SeoEntry) {
  if (!confirm(`Ștergi configurația SEO pentru "${e.path}"?`)) return;
  busy.value = e.id;
  try {
    await $api(`/admin/seo/${e.id}`, { method: 'DELETE' });
    await refresh();
  } finally {
    busy.value = '';
  }
}

// add new path
const newPath = ref('');
const addError = ref('');
const adding = ref(false);
async function addPath() {
  addError.value = '';
  if (!/^(\*|\/[\w\-/]*)$/.test(newPath.value)) {
    addError.value = 'Path invalid (ex. "/talent").';
    return;
  }
  adding.value = true;
  try {
    await $api('/admin/seo', { method: 'POST', body: { path: newPath.value } });
    newPath.value = '';
    await refresh();
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    addError.value = Array.isArray(msg) ? msg[0]! : msg || 'Adăugarea a eșuat.';
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="container-page max-w-3xl py-10">
    <NuxtLink to="/admin" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Panou admin
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">SEO</h1>
    <p class="mt-1 text-sm text-body">
      Meta tag-uri per pagină. Rândul <code class="rounded bg-slate-100 px-1">*</code> ține valorile implicite globale.
    </p>

    <!-- Add path -->
    <form class="mt-6 flex flex-wrap items-start gap-2" @submit.prevent="addPath">
      <div class="flex-1">
        <UiInput v-model="newPath" placeholder="Adaugă o rută nouă, ex. /jobs" icon="lucide:link" />
        <p v-if="addError" class="mt-1 text-xs text-red-600">{{ addError }}</p>
      </div>
      <UiButton type="submit" :loading="adding">Adaugă</UiButton>
    </form>

    <div class="mt-6 space-y-4">
      <div
        v-for="e in entries"
        :key="e.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-card"
      >
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Icon :name="e.path === '*' ? 'lucide:globe' : 'lucide:file'" class="size-4 text-brand-600" />
            <code class="font-semibold text-ink">{{ e.path }}</code>
            <span v-if="e.path === '*'" class="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Global</span>
          </div>
          <button
            v-if="e.path !== '*'"
            class="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            :disabled="busy === e.id"
            @click="remove(e)"
          >
            Șterge
          </button>
        </div>

        <div class="mt-4 space-y-3">
          <UiInput v-model="e.title" label="Titlu (title / og:title)" placeholder="ex. Găsește talente" />
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Descriere (meta description)</label>
            <textarea v-model="e.description" rows="2" class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none" />
          </div>
          <UiInput v-model="e.keywords" label="Keywords (opțional)" placeholder="freelancing, joburi, …" />
          <UiInput v-model="e.ogImageUrl" label="Imagine Open Graph (URL)" placeholder="https://…/og.png" icon="lucide:image" />
          <UiInput v-if="e.path === '*'" v-model="e.titleTemplate" label="Șablon titlu" placeholder="%s · aplica" />
          <label class="flex items-center gap-2.5">
            <input v-model="e.noindex" type="checkbox" class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" />
            <span class="text-sm text-ink">noindex (ascunde pagina de motoarele de căutare)</span>
          </label>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <UiButton size="sm" :loading="busy === e.id" @click="save(e)">Salvează</UiButton>
          <span v-if="savedId === e.id" class="text-sm font-medium text-brand-600">Salvat ✓</span>
        </div>
      </div>
    </div>
  </div>
</template>
