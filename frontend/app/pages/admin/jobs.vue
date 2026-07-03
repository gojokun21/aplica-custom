<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface AdminJob {
  id: string;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  budgetType: 'FIXED' | 'HOURLY';
  createdAt: string;
  client: { firstName: string; lastName: string };
  applicationsCount: number;
}
interface JobList {
  items: AdminJob[];
  total: number;
  page: number;
  totalPages: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const search = ref((route.query.q as string) || '');

const { data, pending, refresh } = await useAsyncData(
  'admin-jobs',
  () =>
    $api<JobList>('/admin/jobs', {
      query: { q: route.query.q || undefined, page: route.query.page || 1, limit: 20 },
    }),
  { watch: [() => route.query], default: () => ({ items: [], total: 0, page: 1, totalPages: 0 }) },
);
const currentPage = computed(() => Number(route.query.page) || 1);
function submitSearch() {
  router.push({ path: '/admin/jobs', query: { ...(search.value ? { q: search.value } : {}) } });
}
function goToPage(p: number) {
  router.push({ path: '/admin/jobs', query: { ...route.query, page: p } });
}

const busy = ref('');
async function removeJob(j: AdminJob) {
  if (!confirm(`Ștergi jobul „${j.title}"? Se șterg și aplicările și conversația asociată.`)) return;
  busy.value = j.id;
  try {
    await $api(`/admin/jobs/${j.id}`, { method: 'DELETE' });
    await refresh();
  } finally {
    busy.value = '';
  }
}
const statusLabel: Record<string, string> = { OPEN: 'Deschis', IN_PROGRESS: 'În lucru', COMPLETED: 'Finalizat', CANCELLED: 'Anulat' };
</script>

<template>
  <div class="container-page py-10">
    <NuxtLink to="/admin" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Panou admin
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Joburi</h1>

    <form class="mt-6 flex max-w-md items-center gap-2 rounded-full border border-slate-300 bg-white p-1.5 pl-5 focus-within:border-brand-600" @submit.prevent="submitSearch">
      <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
      <input v-model="search" type="text" placeholder="Caută după titlu…" class="h-9 w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0" />
      <UiButton type="submit" size="sm">Caută</UiButton>
    </form>

    <p class="mt-4 text-sm text-body">{{ data.total }} joburi</p>

    <div class="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-semibold">Titlu</th>
            <th class="px-4 py-3 font-semibold">Client</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 font-semibold">Aplicanți</th>
            <th class="px-4 py-3 text-right font-semibold">Acțiuni</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="j in data.items" :key="j.id" class="bg-white">
            <td class="px-4 py-3">
              <NuxtLinkLocale :to="`/proiecte/${j.id}`" class="font-medium text-ink hover:text-brand-700">{{ j.title }}</NuxtLinkLocale>
            </td>
            <td class="px-4 py-3 text-body">{{ j.client.firstName }} {{ j.client.lastName }}</td>
            <td class="px-4 py-3"><span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{{ statusLabel[j.status] }}</span></td>
            <td class="px-4 py-3 text-body">{{ j.applicationsCount }}</td>
            <td class="px-4 py-3 text-right">
              <button class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" :disabled="busy === j.id" @click="removeJob(j)">Șterge</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!pending && data.items.length === 0" class="py-10 text-center text-sm text-body">Niciun job găsit.</p>
    </div>

    <div v-if="data.totalPages > 1" class="mt-6 flex items-center justify-center gap-1.5">
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)"><Icon name="lucide:chevron-left" class="size-4" /></button>
      <span class="px-2 text-sm text-body">{{ currentPage }} / {{ data.totalPages }}</span>
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage >= data.totalPages" @click="goToPage(currentPage + 1)"><Icon name="lucide:chevron-right" class="size-4" /></button>
    </div>
  </div>
</template>
