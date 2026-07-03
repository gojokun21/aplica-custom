<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'client-only'] });

interface Skill { id: string; name: string; slug: string }
interface MyJob {
  id: string;
  title: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetCents: number | null;
  minRateCents: number | null;
  maxRateCents: number | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deliveredAt: string | null;
  createdAt: string;
  skills: Skill[];
  applicationsCount: number;
}

const { $api } = useNuxtApp();
const { data: jobs } = await useAsyncData('my-jobs', () =>
  $api<MyJob[]>('/jobs/mine').catch(() => [] as MyJob[]),
);

function budget(j: MyJob) {
  if (j.budgetType === 'FIXED') return j.budgetCents != null ? `€${(j.budgetCents / 100).toLocaleString()}` : '—';
  return `€${Math.round((j.minRateCents ?? 0) / 100)}–€${Math.round((j.maxRateCents ?? 0) / 100)}/h`;
}
const statusLabel: Record<string, string> = { OPEN: 'Deschis', IN_PROGRESS: 'În lucru', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };
const statusClass: Record<string, string> = {
  OPEN: 'bg-brand-50 text-brand-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-50 text-red-700',
};
</script>

<template>
  <div class="container-page max-w-4xl py-10">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <NuxtLink to="/dashboard" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
          <Icon name="lucide:arrow-left" class="size-4" /> Dashboard
        </NuxtLink>
        <h1 class="mt-2 text-2xl font-bold text-ink">Joburile mele</h1>
      </div>
      <UiButton to="/proiecte/nou"><Icon name="lucide:plus" class="size-4" /> Postează un job</UiButton>
    </div>

    <div v-if="!jobs || jobs.length === 0" class="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:briefcase" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Nu ai postat niciun job încă</p>
      <UiButton to="/proiecte/nou" class="mt-6">Postează primul job</UiButton>
    </div>

    <div v-else class="mt-6 space-y-4">
      <div v-for="j in jobs" :key="j.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <NuxtLinkLocale :to="`/proiecte/${j.id}`" class="text-lg font-semibold text-ink hover:text-brand-700">{{ j.title }}</NuxtLinkLocale>
            <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-body">
              <span :class="['rounded-full px-2 py-0.5 text-xs font-semibold', statusClass[j.status]]">{{ statusLabel[j.status] }}</span>
              <span v-if="j.status === 'IN_PROGRESS' && j.deliveredAt" class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Livrat — confirmă
              </span>
              <span>{{ budget(j) }}</span>
            </div>
          </div>
          <UiButton :to="`/proiecte/${j.id}/aplicanti`" variant="outline" size="sm">
            {{ j.applicationsCount }} aplicanți
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
