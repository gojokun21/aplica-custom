<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN';
  avatarUrl: string | null;
  blockedAt: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}
interface UserList {
  items: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const { user: me } = useAuth();

const search = ref((route.query.q as string) || '');

const { data, pending, refresh } = await useAsyncData(
  'admin-users',
  () =>
    $api<UserList>('/admin/users', {
      query: { q: route.query.q || undefined, page: route.query.page || 1, limit: 20 },
    }),
  { watch: [() => route.query], default: () => ({ items: [], total: 0, page: 1, totalPages: 0 }) },
);

const currentPage = computed(() => Number(route.query.page) || 1);
function submitSearch() {
  router.push({ path: '/admin/users', query: { ...(search.value ? { q: search.value } : {}) } });
}
function goToPage(p: number) {
  router.push({ path: '/admin/users', query: { ...route.query, page: p } });
}

const busy = ref('');
async function changeRole(u: AdminUser, role: string) {
  busy.value = u.id;
  try {
    await $api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role } });
    await refresh();
  } finally {
    busy.value = '';
  }
}
async function toggleBlock(u: AdminUser) {
  busy.value = u.id;
  try {
    await $api(`/admin/users/${u.id}/block`, { method: 'PATCH', body: { blocked: !u.blockedAt } });
    await refresh();
  } finally {
    busy.value = '';
  }
}
async function removeUser(u: AdminUser) {
  if (!confirm(`Ștergi definitiv contul ${u.email}? Această acțiune este ireversibilă.`)) return;
  busy.value = u.id;
  try {
    await $api(`/admin/users/${u.id}`, { method: 'DELETE' });
    await refresh();
  } finally {
    busy.value = '';
  }
}

const roleClass: Record<string, string> = {
  ADMIN: 'bg-brand-50 text-brand-700',
  CLIENT: 'bg-slate-100 text-slate-600',
  FREELANCER: 'bg-amber-50 text-amber-700',
};
</script>

<template>
  <div class="container-page py-10">
    <NuxtLink to="/admin" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Panou admin
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Utilizatori</h1>

    <form class="mt-6 flex max-w-md items-center gap-2 rounded-full border border-slate-300 bg-white p-1.5 pl-5 focus-within:border-brand-600" @submit.prevent="submitSearch">
      <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
      <input v-model="search" type="text" placeholder="Caută nume sau email…" class="h-9 w-full bg-transparent text-sm text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0" />
      <UiButton type="submit" size="sm">Caută</UiButton>
    </form>

    <p class="mt-4 text-sm text-body">{{ data.total }} utilizatori</p>

    <div class="mt-3 overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3 font-semibold">Utilizator</th>
            <th class="px-4 py-3 font-semibold">Rol</th>
            <th class="px-4 py-3 font-semibold">Status</th>
            <th class="px-4 py-3 text-right font-semibold">Acțiuni</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="u in data.items" :key="u.id" class="bg-white">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <UiAvatar :first-name="u.firstName" :last-name="u.lastName" :avatar-url="u.avatarUrl" size="sm" />
                <div class="min-w-0">
                  <p class="font-medium text-ink">{{ u.firstName }} {{ u.lastName }}<span v-if="u.id === me?.id" class="ml-1 text-xs text-brand-600">(tu)</span></p>
                  <p class="truncate text-xs text-body">{{ u.email }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.role"
                :disabled="u.id === me?.id || busy === u.id"
                class="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold disabled:opacity-50"
                :class="roleClass[u.role]"
                @change="changeRole(u, ($event.target as HTMLSelectElement).value)"
              >
                <option value="CLIENT">CLIENT</option>
                <option value="FREELANCER">FREELANCER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span v-if="u.blockedAt" class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">Blocat</span>
              <span v-else class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Activ</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  v-if="u.id !== me?.id"
                  class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  :disabled="busy === u.id"
                  @click="toggleBlock(u)"
                >
                  {{ u.blockedAt ? 'Deblochează' : 'Blochează' }}
                </button>
                <button
                  v-if="u.id !== me?.id"
                  class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  :disabled="busy === u.id"
                  @click="removeUser(u)"
                >
                  Șterge
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!pending && data.items.length === 0" class="py-10 text-center text-sm text-body">Niciun utilizator găsit.</p>
    </div>

    <div v-if="data.totalPages > 1" class="mt-6 flex items-center justify-center gap-1.5">
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)"><Icon name="lucide:chevron-left" class="size-4" /></button>
      <span class="px-2 text-sm text-body">{{ currentPage }} / {{ data.totalPages }}</span>
      <button class="flex size-9 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-40" :disabled="currentPage >= data.totalPages" @click="goToPage(currentPage + 1)"><Icon name="lucide:chevron-right" class="size-4" /></button>
    </div>
  </div>
</template>
