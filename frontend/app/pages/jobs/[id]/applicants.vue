<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'client-only'] });

interface Applicant {
  id: string;
  freelancerId: string;
  coverLetter: string | null;
  proposedRateCents: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
  freelancer: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  freelancerProfile: { title: string | null; hourlyRateCents: number | null } | null;
}

const route = useRoute();
const { $api } = useNuxtApp();

const { data: job } = await useAsyncData(`job-head-${route.params.id}`, () =>
  $api<{ id: string; title: string; status: string }>(`/jobs/${route.params.id}`).catch(() => null),
);
const { data: applicants, refresh } = await useAsyncData(`applicants-${route.params.id}`, () =>
  $api<Applicant[]>(`/jobs/${route.params.id}/applications`).catch(() => [] as Applicant[]),
);

const accepting = ref<string | null>(null);
const error = ref('');

async function accept(app: Applicant) {
  error.value = '';
  accepting.value = app.id;
  try {
    const conv = await $api<{ id: string }>(`/applications/${app.id}/accept`, { method: 'POST' });
    await navigateTo(`/messages/${conv.id}`);
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    error.value = msg || 'Acceptarea a eșuat.';
    await refresh();
  } finally {
    accepting.value = null;
  }
}

const statusLabel: Record<string, string> = { PENDING: 'În așteptare', ACCEPTED: 'Acceptat', REJECTED: 'Respins', WITHDRAWN: 'Retras' };
const jobClosed = computed(() => job.value && job.value.status !== 'OPEN');
</script>

<template>
  <div class="container-page max-w-4xl py-10">
    <NuxtLink :to="`/jobs/${route.params.id}`" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Înapoi la anunț
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Aplicanți</h1>
    <p v-if="job" class="text-body">{{ job.title }}</p>

    <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>
    <UiAlert v-if="jobClosed" variant="info" class="mt-6">
      Ai selectat deja un freelancer pentru acest proiect.
    </UiAlert>

    <div v-if="!applicants || applicants.length === 0" class="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:inbox" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Încă niciun aplicant</p>
    </div>

    <div v-else class="mt-6 space-y-4">
      <div v-for="a in applicants" :key="a.id" class="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div class="flex items-start gap-4">
          <UiAvatar
            :first-name="a.freelancer.firstName"
            :last-name="a.freelancer.lastName"
            :avatar-url="a.freelancer.avatarUrl"
            size="md"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <NuxtLink :to="`/talent/${a.freelancerId}`" class="font-semibold text-ink hover:text-brand-700">
                {{ a.freelancer.firstName }} {{ a.freelancer.lastName }}
              </NuxtLink>
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{{ statusLabel[a.status] }}</span>
            </div>
            <p v-if="a.freelancerProfile?.title" class="text-sm text-body">{{ a.freelancerProfile.title }}</p>
            <div v-if="a.coverLetter" class="rich mt-2 text-sm" v-html="a.coverLetter" />
            <p v-if="a.proposedRateCents != null" class="mt-2 text-sm font-medium text-ink">
              Tarif propus: €{{ Math.round(a.proposedRateCents / 100) }}
            </p>
          </div>
          <div class="shrink-0">
            <UiButton v-if="a.status === 'PENDING' && !jobClosed" size="sm" :loading="accepting === a.id" @click="accept(a)">
              Acceptă
            </UiButton>
            <span v-else-if="a.status === 'ACCEPTED'" class="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              <Icon name="lucide:check" class="size-4" /> Selectat
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
