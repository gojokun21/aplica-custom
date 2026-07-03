<script setup lang="ts">
interface Skill { id: string; name: string; slug: string }
interface JobItem {
  id: string;
  title: string;
  description: string;
  budgetType: 'FIXED' | 'HOURLY';
  budgetCents: number | null;
  minRateCents: number | null;
  maxRateCents: number | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  client: { id: string; firstName: string; lastName: string };
  skills: Skill[];
  applicationsCount: number;
}
interface JobList {
  items: JobItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const { user } = useAuth();
const localePath = useLocalePath();

const searchInput = ref((route.query.q as string) || '');

const { data: skills } = await useAsyncData('jobs-skills-filter', () =>
  $api<Skill[]>('/skills').catch(() => [] as Skill[]),
);

const { data, pending } = await useAsyncData(
  'jobs-list',
  () =>
    $api<JobList>('/jobs', {
      query: {
        q: route.query.q || undefined,
        skill: route.query.skill || undefined,
        status: route.query.status || undefined,
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
  Object.keys(query).forEach((k) => { if (query[k] === '' || query[k] == null) delete query[k]; });
  router.push({ path: localePath('/proiecte'), query });
}
function submitSearch() { updateQuery({ q: searchInput.value || undefined, page: undefined }); }
function toggleSkill(slug: string) { updateQuery({ skill: activeSkill.value === slug ? undefined : slug, page: undefined }); }
function goToPage(p: number) { updateQuery({ page: p }); if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' }); }

function budget(j: JobItem) {
  if (j.budgetType === 'FIXED') return j.budgetCents != null ? `€${(j.budgetCents / 100).toLocaleString()} fix` : 'Preț fix';
  const lo = j.minRateCents != null ? Math.round(j.minRateCents / 100) : '?';
  const hi = j.maxRateCents != null ? Math.round(j.maxRateCents / 100) : '?';
  return `€${lo}–€${hi}/h`;
}
const statusLabel: Record<string, string> = { OPEN: 'Deschis', IN_PROGRESS: 'În lucru', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };
function plain(html: string) {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
</script>

<template>
  <div>
    <section class="border-b border-slate-200 bg-slate-50">
      <div class="container-page py-10">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-bold sm:text-4xl">Găsește proiecte</h1>
            <p class="mt-2 text-body">Anunțuri de la clienți, gata de aplicat.</p>
          </div>
          <UiButton v-if="user?.role === 'CLIENT'" to="/proiecte/nou">
            <Icon name="lucide:plus" class="size-4" /> Postează un job
          </UiButton>
        </div>

        <form
          class="mt-6 flex max-w-2xl items-center gap-2 rounded-full border border-slate-300 bg-white p-1.5 pl-5 focus-within:border-brand-600"
          @submit.prevent="submitSearch"
        >
          <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
          <input v-model="searchInput" type="text" placeholder="Caută proiecte…" class="h-10 w-full bg-transparent text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0" />
          <UiButton type="submit" size="md" class="shrink-0">Caută</UiButton>
        </form>
      </div>
    </section>

    <div class="container-page py-8">
      <div class="flex flex-wrap items-center gap-2">
        <button :class="['rounded-full border px-3.5 py-1.5 text-sm transition-colors', !activeSkill ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-ink hover:border-brand-500']" @click="updateQuery({ skill: undefined, page: undefined })">Toate</button>
        <button v-for="s in skills" :key="s.id" :class="['rounded-full border px-3.5 py-1.5 text-sm transition-colors', activeSkill === s.slug ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-ink hover:border-brand-500']" @click="toggleSkill(s.slug)">{{ s.name }}</button>
      </div>

      <p class="mt-6 text-sm text-body"><span v-if="!pending">{{ data.total }} proiecte găsite</span><span v-else>Se încarcă…</span></p>

      <div v-if="pending" class="mt-4 space-y-4">
        <div v-for="i in 5" :key="i" class="h-32 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
      </div>

      <div v-else-if="data.items.length === 0" class="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <Icon name="lucide:search-x" class="mx-auto size-10 text-slate-300" />
        <p class="mt-3 font-medium text-ink">Niciun proiect găsit</p>
      </div>

      <div v-else class="mt-4 space-y-4">
        <NuxtLinkLocale v-for="j in data.items" :key="j.id" :to="`/proiecte/${j.id}`" class="block rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-pop">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h3 class="truncate text-lg font-semibold text-ink hover:text-brand-700">{{ j.title }}</h3>
              <p class="mt-0.5 text-sm text-body">{{ j.client.firstName }} {{ j.client.lastName }} · {{ statusLabel[j.status] }}</p>
            </div>
            <span class="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{{ budget(j) }}</span>
          </div>
          <p class="mt-3 line-clamp-2 text-sm text-body">{{ plain(j.description) }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <span v-for="s in j.skills.slice(0, 5)" :key="s.id" class="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{{ s.name }}</span>
            <span class="ml-auto text-xs text-slate-400">{{ j.applicationsCount }} aplicanți</span>
          </div>
        </NuxtLinkLocale>
      </div>

      <div v-if="!pending && data.totalPages > 1" class="mt-10 flex items-center justify-center gap-1.5">
        <button class="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-ink disabled:opacity-40" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)"><Icon name="lucide:chevron-left" class="size-4" /></button>
        <button v-for="p in data.totalPages" :key="p" :class="['flex size-10 items-center justify-center rounded-lg border text-sm font-medium', p === currentPage ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-ink hover:border-brand-500']" @click="goToPage(p)">{{ p }}</button>
        <button class="flex size-10 items-center justify-center rounded-lg border border-slate-300 text-ink disabled:opacity-40" :disabled="currentPage >= data.totalPages" @click="goToPage(currentPage + 1)"><Icon name="lucide:chevron-right" class="size-4" /></button>
      </div>
    </div>
  </div>
</template>
