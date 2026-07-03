<script setup lang="ts">
interface Skill {
  id: string;
  name: string;
  slug: string;
}
interface FreelancerDetail {
  id: string;
  userId: string;
  title: string | null;
  overview: string | null;
  hourlyRateCents: number | null;
  countryCode: string | null;
  available: boolean;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  skills: Skill[];
  rating: { avg: number; count: number };
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

const { data: f, error } = await useAsyncData(`freelancer-${route.params.userId}`, () =>
  $api<FreelancerDetail>(`/profiles/freelancers/${route.params.userId}`),
);
const { data: reviewData } = await useAsyncData(`freelancer-reviews-${route.params.userId}`, () =>
  $api<{ items: Review[]; summary: { avg: number; count: number } }>(
    `/users/${route.params.userId}/reviews`,
  ).catch(() => ({ items: [] as Review[], summary: { avg: 0, count: 0 } })),
);

const rate = computed(() =>
  f.value?.hourlyRateCents != null ? `€${Math.round(f.value.hourlyRateCents / 100)}/h` : '—',
);
const initials = computed(() =>
  f.value ? (f.value.user.firstName[0] ?? '') + (f.value.user.lastName[0] ?? '') : '',
);
</script>

<template>
  <div class="container-page py-10">
    <NuxtLink to="/talent" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Înapoi la talente
    </NuxtLink>

    <div v-if="error" class="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:user-x" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Freelancer inexistent</p>
      <UiButton to="/talent" variant="outline" class="mt-6">Vezi alți freelanceri</UiButton>
    </div>

    <div v-else-if="f" class="mt-6 grid gap-6 lg:grid-cols-3">
      <!-- Main -->
      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div class="flex items-start gap-4">
            <UiAvatar
              :first-name="f.user.firstName"
              :last-name="f.user.lastName"
              :avatar-url="f.user.avatarUrl"
              size="xl"
            />
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-bold text-ink">
                  {{ f.user.firstName }} {{ f.user.lastName }}
                </h1>
                <span
                  v-if="f.available"
                  class="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700"
                >
                  Disponibil
                </span>
              </div>
              <p class="mt-1 text-body">{{ f.title || 'Freelancer' }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
                <span v-if="f.rating.count > 0" class="flex items-center gap-1.5">
                  <UiStars :model-value="f.rating.avg" readonly size="sm" />
                  <span class="font-medium text-ink">{{ f.rating.avg.toFixed(1) }}</span>
                  <span>({{ f.rating.count }})</span>
                </span>
                <span v-else class="text-slate-400">Fără recenzii încă</span>
                <span v-if="f.countryCode" class="flex items-center gap-1">
                  <Icon name="lucide:map-pin" class="size-4" /> {{ f.countryCode }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="f.overview" class="mt-6">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Despre</h2>
            <!-- overview e HTML sanitizat pe backend (sanitize-html) -->
            <div class="rich mt-2" v-html="f.overview" />
          </div>

          <div v-if="f.skills.length" class="mt-6">
            <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500">Skill-uri</h2>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="s in f.skills"
                :key="s.id"
                class="rounded-full border border-slate-200 px-3 py-1 text-sm text-ink"
              >
                {{ s.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- Recenzii primite -->
        <div v-if="reviewData && reviewData.items.length" class="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 class="text-lg font-semibold text-ink">
            Recenzii ({{ reviewData.summary.count }})
          </h2>
          <div class="mt-4 space-y-4">
            <div v-for="r in reviewData.items" :key="r.id" class="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold text-ink">{{ r.reviewer.firstName }} {{ r.reviewer.lastName }}</p>
                <UiStars :model-value="r.rating" readonly size="sm" />
              </div>
              <div v-if="r.comment" class="rich mt-1.5 text-sm" v-html="r.comment" />
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <p class="text-sm text-body">Tarif orar</p>
          <p class="mt-1 text-3xl font-bold text-ink">{{ rate }}</p>
          <UiButton to="/register" size="lg" block class="mt-5">Contactează</UiButton>
          <UiButton to="/register" variant="outline" size="lg" block class="mt-3">
            Salvează profilul
          </UiButton>
          <p class="mt-4 flex items-center gap-2 text-xs text-body">
            <Icon name="lucide:messages-square" class="size-4 text-brand-600" />
            Discutați direct prin chat
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>
