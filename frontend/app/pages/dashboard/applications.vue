<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'freelancer-only'] });

interface MyApplication {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  proposedRateCents: number | null;
  createdAt: string;
  job: {
    id: string;
    title: string;
    status: string;
    budgetType: 'FIXED' | 'HOURLY';
    budgetCents: number | null;
    client: { id: string; firstName: string; lastName: string };
  };
}

const { $api } = useNuxtApp();
const { data: apps } = await useAsyncData('my-applications', () =>
  $api<MyApplication[]>('/applications/mine').catch(() => [] as MyApplication[]),
);

const statusLabel: Record<string, string> = { PENDING: 'În așteptare', ACCEPTED: 'Acceptat', REJECTED: 'Respins', WITHDRAWN: 'Retras' };
const statusClass: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-brand-50 text-brand-700',
  REJECTED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-600',
};
</script>

<template>
  <div class="container-page max-w-4xl py-10">
    <NuxtLink to="/dashboard" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Dashboard
    </NuxtLink>
    <h1 class="mt-2 text-2xl font-bold text-ink">Aplicările mele</h1>

    <div v-if="!apps || apps.length === 0" class="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:file-text" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Nu ai aplicat la niciun proiect</p>
      <UiButton to="/proiecte" class="mt-6">Găsește proiecte</UiButton>
    </div>

    <div v-else class="mt-6 space-y-4">
      <div v-for="a in apps" :key="a.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLinkLocale :to="`/proiecte/${a.job.id}`" class="text-lg font-semibold text-ink hover:text-brand-700">{{ a.job.title }}</NuxtLinkLocale>
            <p class="mt-0.5 text-sm text-body">{{ a.job.client.firstName }} {{ a.job.client.lastName }}</p>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span :class="['rounded-full px-2.5 py-0.5 text-xs font-semibold', statusClass[a.status]]">{{ statusLabel[a.status] }}</span>
            <NuxtLink v-if="a.status === 'ACCEPTED'" to="/messages" class="link text-sm">Mergi la chat →</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
