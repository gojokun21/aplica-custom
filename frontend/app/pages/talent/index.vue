<script setup lang="ts">
interface Skill {
  id: string;
  name: string;
  slug: string;
}
interface FreelancerItem {
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
interface FreelancerList {
  items: FreelancerItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

const searchInput = ref((route.query.q as string) || '');

const { data: skills } = await useAsyncData('skills-filter', () =>
  $api<Skill[]>('/skills').catch(() => [] as Skill[]),
);

const { data, pending } = await useAsyncData(
  'freelancers-list',
  () =>
    $api<FreelancerList>('/profiles/freelancers', {
      query: {
        q: route.query.q || undefined,
        skill: route.query.skill || undefined,
        page: route.query.page || 1,
        limit: 12,
      },
    }),
  { watch: [() => route.query], default: () => ({ items: [], total: 0, page: 1, limit: 12, totalPages: 0 }) },
);

const activeSkill = computed(() => (route.query.skill as string) || '');
const currentPage = computed(() => Number(route.query.page) || 1);

function updateQuery(patch: Record<string, string | number | undefined>) {
  const query = { ...route.query, ...patch };
  // curăță valorile goale
  Object.keys(query).forEach((k) => {
    if (query[k] === '' || query[k] == null) delete query[k];
  });
  router.push({ path: '/talent', query });
}

function submitSearch() {
  updateQuery({ q: searchInput.value || undefined, page: undefined });
}
function toggleSkill(slug: string) {
  updateQuery({ skill: activeSkill.value === slug ? undefined : slug, page: undefined });
}
function goToPage(p: number) {
  updateQuery({ page: p });
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function rate(cents: number | null) {
  return cents != null ? `€${Math.round(cents / 100)}/h` : '—';
}
function initials(f: FreelancerItem) {
  return (f.user.firstName[0] ?? '') + (f.user.lastName[0] ?? '');
}
/** Text simplu din HTML pentru preview-ul de pe card. */
function plain(html: string | null) {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
</script>

<template>
  <div>
    <!-- Header -->
    <section class="border-b border-slate-200 bg-slate-50">
      <div class="container-page py-10">
        <h1 class="text-3xl font-bold sm:text-4xl">Găsește talente</h1>
        <p class="mt-2 text-body">Freelanceri verificați, gata de colaborare.</p>

        <form
          class="mt-6 flex max-w-2xl items-center gap-2 rounded-full border border-slate-300 bg-white p-1.5 pl-5 focus-within:border-brand-600"
          @submit.prevent="submitSearch"
        >
          <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
          <input
            v-model="searchInput"
            type="text"
            placeholder="Caută după nume, titlu sau expertiză…"
            class="h-10 w-full bg-transparent text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0"
          />
          <UiButton type="submit" size="md" class="shrink-0">Caută</UiButton>
        </form>
      </div>
    </section>

    <div class="container-page py-8">
      <!-- Skill filters -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          :class="[
            'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            !activeSkill
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-300 text-ink hover:border-brand-500',
          ]"
          @click="updateQuery({ skill: undefined, page: undefined })"
        >
          Toate
        </button>
        <button
          v-for="s in skills"
          :key="s.id"
          :class="[
            'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            activeSkill === s.slug
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-300 text-ink hover:border-brand-500',
          ]"
          @click="toggleSkill(s.slug)"
        >
          {{ s.name }}
        </button>
      </div>

      <!-- Results meta -->
      <p class="mt-6 text-sm text-body">
        <span v-if="!pending">{{ data.total }} freelanceri găsiți</span>
        <span v-else>Se încarcă…</span>
      </p>

      <!-- Loading skeleton -->
      <div v-if="pending" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="i in 6"
          :key="i"
          class="h-52 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
        />
      </div>

      <!-- Empty -->
      <div v-else-if="data.items.length === 0" class="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <Icon name="lucide:search-x" class="mx-auto size-10 text-slate-300" />
        <p class="mt-3 font-medium text-ink">Niciun freelancer găsit</p>
        <p class="mt-1 text-sm text-body">Încearcă alt termen de căutare sau alt skill.</p>
      </div>

      <!-- Results grid -->
      <div v-else class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="f in data.items"
          :key="f.id"
          :to="`/talent/${f.userId}`"
          class="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-pop"
        >
          <div class="flex items-start gap-3">
            <UiAvatar
              :first-name="f.user.firstName"
              :last-name="f.user.lastName"
              :avatar-url="f.user.avatarUrl"
              size="md"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-ink group-hover:text-brand-700">
                {{ f.user.firstName }} {{ f.user.lastName }}
              </p>
              <p class="truncate text-sm text-body">{{ f.title || 'Freelancer' }}</p>
            </div>
            <span
              v-if="f.available"
              class="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700"
            >
              Disponibil
            </span>
          </div>

          <p v-if="f.overview" class="mt-3 line-clamp-2 flex-1 text-sm text-body">
            {{ plain(f.overview) }}
          </p>
          <div v-else class="flex-1" />

          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="s in f.skills.slice(0, 3)"
              :key="s.id"
              class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
            >
              {{ s.name }}
            </span>
            <span v-if="f.skills.length > 3" class="px-1 py-0.5 text-xs text-slate-400">
              +{{ f.skills.length - 3 }}
            </span>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span class="text-sm font-semibold text-ink">{{ rate(f.hourlyRateCents) }}</span>
            <span v-if="f.rating.count > 0" class="flex items-center gap-1 text-xs text-body">
              <Icon name="lucide:star" class="size-3.5 fill-amber-400 text-amber-400" />
              <span class="font-medium text-ink">{{ f.rating.avg.toFixed(1) }}</span>
              ({{ f.rating.count }})
            </span>
            <span v-else-if="f.countryCode" class="flex items-center gap-1 text-xs text-body">
              <Icon name="lucide:map-pin" class="size-3.5" /> {{ f.countryCode }}
            </span>
          </div>
        </NuxtLink>
      </div>

      <!-- Pagination -->
      <div v-if="!pending && data.totalPages > 1" class="mt-10 flex items-center justify-center gap-1.5">
        <button
          class="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-ink disabled:opacity-40"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <Icon name="lucide:chevron-left" class="size-4" />
        </button>
        <button
          v-for="p in data.totalPages"
          :key="p"
          :class="[
            'flex size-10 items-center justify-center rounded-lg border text-sm font-medium',
            p === currentPage
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-slate-300 text-ink hover:border-brand-500',
          ]"
          @click="goToPage(p)"
        >
          {{ p }}
        </button>
        <button
          class="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-ink disabled:opacity-40"
          :disabled="currentPage >= data.totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <Icon name="lucide:chevron-right" class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>
