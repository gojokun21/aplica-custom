<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'admin'] });

interface Stats {
  users: { total: number; clients: number; freelancers: number; admins: number; blocked: number };
  jobs: { total: number; open: number; inProgress: number; completed: number; cancelled: number };
  applications: number;
  reviews: number;
  conversations: number;
}

const { $api } = useNuxtApp();
const { data: stats } = await useAsyncData('admin-stats', () =>
  $api<Stats>('/admin/stats').catch(() => null),
);

const tiles = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: 'Utilizatori', value: s.users.total, icon: 'lucide:users', sub: `${s.users.clients} clienți · ${s.users.freelancers} freelanceri` },
    { label: 'Joburi', value: s.jobs.total, icon: 'lucide:briefcase', sub: `${s.jobs.open} deschise · ${s.jobs.completed} finalizate` },
    { label: 'Aplicări', value: s.applications, icon: 'lucide:file-text', sub: 'total pe platformă' },
    { label: 'Recenzii', value: s.reviews, icon: 'lucide:star', sub: 'total lăsate' },
    { label: 'Conversații', value: s.conversations, icon: 'lucide:message-square', sub: 'colaborări active' },
    { label: 'Blocați', value: s.users.blocked, icon: 'lucide:user-x', sub: 'conturi blocate' },
  ];
});

const sections = [
  { to: '/admin/users', label: 'Utilizatori', desc: 'Roluri, blocare, ștergere', icon: 'lucide:users' },
  { to: '/admin/jobs', label: 'Joburi', desc: 'Moderare anunțuri', icon: 'lucide:briefcase' },
  { to: '/admin/reviews', label: 'Recenzii', desc: 'Moderare recenzii', icon: 'lucide:star' },
  { to: '/admin/seo', label: 'SEO', desc: 'Meta tag-uri per pagină', icon: 'lucide:search' },
  { to: '/admin/legal', label: 'Pagini legale', desc: 'Termeni și confidențialitate', icon: 'lucide:file-text' },
];
</script>

<template>
  <div class="container-page py-10">
    <div class="flex items-center gap-2">
      <Icon name="lucide:shield" class="size-6 text-brand-600" />
      <h1 class="text-2xl font-bold text-ink">Panou admin</h1>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
      <div v-for="t in tiles" :key="t.label" class="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <Icon :name="t.icon" class="size-6 text-brand-600" />
        <p class="mt-3 text-3xl font-extrabold text-ink">{{ t.value }}</p>
        <p class="text-sm font-medium text-ink">{{ t.label }}</p>
        <p class="mt-0.5 text-xs text-body">{{ t.sub }}</p>
      </div>
    </div>

    <h2 class="mt-10 text-lg font-semibold text-ink">Moderare</h2>
    <div class="mt-4 grid gap-4 sm:grid-cols-3">
      <NuxtLink
        v-for="sec in sections"
        :key="sec.to"
        :to="sec.to"
        class="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-pop"
      >
        <Icon :name="sec.icon" class="size-7 text-brand-600" />
        <p class="mt-3 font-semibold text-ink">{{ sec.label }}</p>
        <p class="mt-1 text-sm text-body">{{ sec.desc }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
