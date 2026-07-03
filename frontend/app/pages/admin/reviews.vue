<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface Party { id: string; firstName: string; lastName: string; avatarUrl: string | null }
interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: Party;
  reviewee: Party;
  job: { id: string; title: string };
}
interface ReviewList {
  items: AdminReview[];
  total: number;
  page: number;
  totalPages: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();

const { data, pending, refresh } = await useAsyncData(
  'admin-reviews',
  () => $api<ReviewList>('/admin/reviews', { query: { page: route.query.page || 1, limit: 20 } }),
  { watch: [() => route.query], default: () => ({ items: [], total: 0, page: 1, totalPages: 0 }) },
);
const currentPage = computed(() => Number(route.query.page) || 1);
function goToPage(p: number) {
  router.push({ path: '/admin/reviews', query: { page: p } });
}

const busy = ref('');
async function removeReview(r: AdminReview) {
  if (!confirm('Ștergi această recenzie?')) return;
  busy.value = r.id;
  try {
    await $api(`/admin/reviews/${r.id}`, { method: 'DELETE' });
    await refresh();
  } finally {
    busy.value = '';
  }
}
</script>

<template>
  <div class="container-page py-10">
    <NuxtLink to="/admin" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Panou admin
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Recenzii</h1>
    <p class="mt-2 text-sm text-body">{{ data.total }} recenzii</p>

    <div v-if="pending" class="mt-4 text-sm text-body">Se încarcă…</div>
    <p v-else-if="data.items.length === 0" class="mt-6 rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-body">Nicio recenzie.</p>

    <div v-else class="mt-4 space-y-3">
      <div v-for="r in data.items" :key="r.id" class="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <UiStars :model-value="r.rating" readonly size="sm" />
              <span class="text-sm font-medium text-ink">{{ r.reviewer.firstName }} {{ r.reviewer.lastName }}</span>
              <Icon name="lucide:arrow-right" class="size-3.5 text-slate-400" />
              <span class="text-sm text-body">{{ r.reviewee.firstName }} {{ r.reviewee.lastName }}</span>
            </div>
            <div v-if="r.comment" class="rich mt-1.5 text-sm text-body" v-html="r.comment" />
            <NuxtLink :to="`/jobs/${r.job.id}`" class="mt-1 inline-block text-xs text-slate-400 hover:text-brand-600">{{ r.job.title }}</NuxtLink>
          </div>
          <button class="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" :disabled="busy === r.id" @click="removeReview(r)">Șterge</button>
        </div>
      </div>
    </div>

    <div v-if="data.totalPages > 1" class="mt-6 flex items-center justify-center gap-1.5">
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)"><Icon name="lucide:chevron-left" class="size-4" /></button>
      <span class="px-2 text-sm text-body">{{ currentPage }} / {{ data.totalPages }}</span>
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage >= data.totalPages" @click="goToPage(currentPage + 1)"><Icon name="lucide:chevron-right" class="size-4" /></button>
    </div>
  </div>
</template>
