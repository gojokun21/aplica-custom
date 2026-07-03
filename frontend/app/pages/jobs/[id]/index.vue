<script setup lang="ts">
interface Skill { id: string; name: string; slug: string }
interface JobDetail {
  id: string;
  clientId: string;
  title: string;
  description: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetCents: number | null;
  minRateCents: number | null;
  maxRateCents: number | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  deliveredAt: string | null;
  completedAt: string | null;
  acceptedFreelancerId: string | null;
  conversationId: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string };
  skills: Skill[];
  applicationsCount: number;
}
interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; firstName: string; lastName: string };
}

const route = useRoute();
const { $api } = useNuxtApp();
const { user } = useAuth();

const { data: job, error, refresh: refreshJob } = await useAsyncData(`job-${route.params.id}`, () =>
  $api<JobDetail>(`/jobs/${route.params.id}`),
);
const { data: reviews, refresh: refreshReviews } = await useAsyncData(`job-reviews-${route.params.id}`, () =>
  $api<Review[]>(`/jobs/${route.params.id}/reviews`).catch(() => [] as Review[]),
);

const isOwner = computed(() => !!user.value && job.value?.clientId === user.value.id);
const isHiredFreelancer = computed(() => !!user.value && job.value?.acceptedFreelancerId === user.value.id);
const isParticipant = computed(() => isOwner.value || isHiredFreelancer.value);
const canApply = computed(() => user.value?.role === 'FREELANCER' && job.value?.status === 'OPEN' && !isOwner.value);

const alreadyReviewed = computed(() => !!user.value && (reviews.value ?? []).some((r) => r.reviewer.id === user.value!.id));
const canReview = computed(() => job.value?.status === 'COMPLETED' && isParticipant.value && !alreadyReviewed.value);

const coverLetter = ref('');
const proposedRate = ref<number | undefined>(undefined);
const applying = ref(false);
const applyError = ref('');
const applied = ref(false);

async function apply() {
  applyError.value = '';
  applying.value = true;
  try {
    await $api(`/jobs/${route.params.id}/applications`, {
      method: 'POST',
      body: {
        coverLetter: coverLetter.value || undefined,
        proposedRateCents: proposedRate.value != null ? Math.round(proposedRate.value * 100) : undefined,
      },
    });
    applied.value = true;
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    applyError.value = Array.isArray(msg) ? msg[0]! : msg || 'Aplicarea a eșuat.';
  } finally {
    applying.value = false;
  }
}

const actionLoading = ref(false);
const actionError = ref('');
async function lifecycleAction(path: 'deliver' | 'complete') {
  actionError.value = '';
  actionLoading.value = true;
  try {
    await $api(`/jobs/${route.params.id}/${path}`, { method: 'POST' });
    await refreshJob();
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    actionError.value = msg || 'Acțiunea a eșuat.';
  } finally {
    actionLoading.value = false;
  }
}

const reviewRating = ref(0);
const reviewComment = ref('');
const reviewLoading = ref(false);
const reviewError = ref('');
async function submitReview() {
  reviewError.value = '';
  if (reviewRating.value < 1) { reviewError.value = 'Alege un rating.'; return; }
  reviewLoading.value = true;
  try {
    await $api(`/jobs/${route.params.id}/reviews`, {
      method: 'POST',
      body: { rating: reviewRating.value, comment: reviewComment.value || undefined },
    });
    reviewComment.value = '';
    reviewRating.value = 0;
    await refreshReviews();
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string } })?.data?.message;
    reviewError.value = msg || 'Recenzia nu a putut fi trimisă.';
  } finally {
    reviewLoading.value = false;
  }
}

const budget = computed(() => {
  const j = job.value;
  if (!j) return '';
  if (j.budgetType === 'FIXED') return j.budgetCents != null ? `€${(j.budgetCents / 100).toLocaleString()} (preț fix)` : 'Preț fix';
  const lo = j.minRateCents != null ? Math.round(j.minRateCents / 100) : '?';
  const hi = j.maxRateCents != null ? Math.round(j.maxRateCents / 100) : '?';
  return `€${lo}–€${hi} / oră`;
});
const statusLabel: Record<string, string> = { OPEN: 'Deschis', IN_PROGRESS: 'În lucru', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };
</script>

<template>
  <div class="container-page py-10">
    <NuxtLink to="/jobs" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Înapoi la proiecte
    </NuxtLink>

    <div v-if="error" class="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:file-x" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Anunț inexistent</p>
      <UiButton to="/jobs" variant="outline" class="mt-6">Vezi alte proiecte</UiButton>
    </div>

    <div v-else-if="job" class="mt-6 grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-bold text-ink">{{ job.title }}</h1>
            <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{{ statusLabel[job.status] }}</span>
          </div>
          <p class="mt-1 text-body">Postat de {{ job.client.firstName }} {{ job.client.lastName }}</p>

          <div class="mt-6">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Descriere</h2>
            <div class="rich mt-2" v-html="job.description" />
          </div>

          <div v-if="job.skills.length" class="mt-6">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Skill-uri cerute</h2>
            <div class="mt-3 flex flex-wrap gap-2">
              <span v-for="s in job.skills" :key="s.id" class="rounded-full border border-slate-200 px-3 py-1 text-sm text-ink">{{ s.name }}</span>
            </div>
          </div>
        </div>

        <!-- Apply form -->
        <div v-if="canApply" class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 class="text-lg font-semibold text-ink">Aplică la acest proiect</h2>
          <UiAlert v-if="applyError" variant="error" class="mt-4">{{ applyError }}</UiAlert>
          <UiAlert v-else-if="applied" variant="success" class="mt-4">Aplicarea a fost trimisă! O găsești în „Aplicările mele".</UiAlert>
          <form v-if="!applied" class="mt-4 space-y-4" @submit.prevent="apply">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700">Scrisoare de intenție</label>
              <UiRichText v-model="coverLetter" placeholder="De ce ești potrivit pentru acest proiect?" :height="180" />
            </div>
            <UiInput v-model.number="proposedRate" label="Tarif propus (EUR)" type="number" icon="lucide:euro" placeholder="ex. 50" />
            <UiButton type="submit" size="lg" :loading="applying">Trimite aplicarea</UiButton>
          </form>
        </div>

        <div v-else-if="user?.role === 'FREELANCER' && job.status !== 'OPEN' && !isParticipant" class="mt-6">
          <UiAlert variant="info">Acest proiect nu mai primește aplicări.</UiAlert>
        </div>

        <!-- Reviews -->
        <div v-if="job.status === 'COMPLETED'" class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 class="text-lg font-semibold text-ink">Recenzii</h2>

          <!-- Review form -->
          <form v-if="canReview" class="mt-4 space-y-3 rounded-xl bg-slate-50 p-4" @submit.prevent="submitReview">
            <p class="text-sm font-medium text-ink">Lasă o recenzie</p>
            <UiStars v-model="reviewRating" size="lg" />
            <UiRichText v-model="reviewComment" placeholder="Cum a decurs colaborarea?" :height="160" />
            <UiAlert v-if="reviewError" variant="error">{{ reviewError }}</UiAlert>
            <UiButton type="submit" :loading="reviewLoading">Trimite recenzia</UiButton>
          </form>
          <UiAlert v-else-if="alreadyReviewed" variant="success" class="mt-4">Ți-ai lăsat recenzia. Mulțumim!</UiAlert>

          <!-- Review list -->
          <div v-if="reviews && reviews.length" class="mt-5 space-y-4">
            <div v-for="r in reviews" :key="r.id" class="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-ink">{{ r.reviewer.firstName }} {{ r.reviewer.lastName }}</p>
                <UiStars :model-value="r.rating" readonly size="sm" />
              </div>
              <div v-if="r.comment" class="rich mt-1.5 text-sm" v-html="r.comment" />
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-body">Încă nicio recenzie.</p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p class="text-sm text-body">Buget</p>
          <p class="mt-1 text-2xl font-bold text-ink">{{ budget }}</p>
          <p class="mt-4 flex items-center gap-2 text-sm text-body"><Icon name="lucide:users-round" class="size-4" /> {{ job.applicationsCount }} aplicanți</p>

          <!-- Lifecycle actions -->
          <div v-if="isParticipant" class="mt-5 space-y-3">
            <UiAlert v-if="actionError" variant="error">{{ actionError }}</UiAlert>

            <UiButton v-if="job.conversationId" :to="`/messages/${job.conversationId}`" variant="outline" size="lg" block>
              <Icon name="lucide:message-square" class="size-4" /> Deschide chat-ul
            </UiButton>

            <!-- Freelancer: mark delivered -->
            <UiButton
              v-if="isHiredFreelancer && job.status === 'IN_PROGRESS' && !job.deliveredAt"
              size="lg" block :loading="actionLoading" @click="lifecycleAction('deliver')"
            >
              Marchează ca livrat
            </UiButton>
            <UiAlert v-else-if="isHiredFreelancer && job.status === 'IN_PROGRESS' && job.deliveredAt" variant="info">
              Livrat — în așteptarea confirmării clientului.
            </UiAlert>

            <!-- Client: confirm completion -->
            <UiButton
              v-if="isOwner && job.status === 'IN_PROGRESS' && job.deliveredAt"
              size="lg" block :loading="actionLoading" @click="lifecycleAction('complete')"
            >
              Confirmă finalizarea
            </UiButton>
            <UiAlert v-else-if="isOwner && job.status === 'IN_PROGRESS' && !job.deliveredAt" variant="info">
              Așteaptă ca freelancerul să marcheze livrarea.
            </UiAlert>

            <p v-if="job.status === 'COMPLETED'" class="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              <Icon name="lucide:circle-check-big" class="size-4" /> Job finalizat
            </p>
          </div>

          <div v-if="isOwner" class="mt-3">
            <UiButton :to="`/jobs/${job.id}/applicants`" variant="outline" size="lg" block>Vezi aplicanții</UiButton>
          </div>
          <div v-else-if="!user" class="mt-5">
            <UiButton to="/register" size="lg" block>Înscrie-te ca să aplici</UiButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
