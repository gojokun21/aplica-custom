<script setup lang="ts">
const year = new Date().getFullYear();

const columns = [
  {
    title: 'Pentru clienți',
    links: [
      { label: 'Cum angajezi', to: '/#how' },
      { label: 'Găsește talente', to: '/talent' },
      { label: 'Postează un proiect', to: '/jobs/new' },
    ],
  },
  {
    title: 'Pentru freelanceri',
    links: [
      { label: 'Cum câștigi', to: '/#how' },
      { label: 'Găsește proiecte', to: '/jobs' },
      { label: 'Creează profil', to: '/register' },
    ],
  },
  {
    title: 'Companie',
    links: [
      { label: 'Despre noi', to: '/' },
      { label: 'Contact', to: '/' },
      { label: 'Termeni și condiții', to: '/terms' },
      { label: 'Confidențialitate', to: '/privacy' },
    ],
  },
];
</script>

<template>
  <footer class="border-t border-slate-200 bg-white">
    <div class="container-page py-14">
      <div class="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <img src="/logo.png" alt="aplica" class="h-9 w-auto" width="180" height="90" />
          <p class="mt-4 max-w-xs text-sm text-body">
            Platforma unde clienții și freelancerii de top construiesc împreună. Talent verificat,
            plăți sigure prin escrow.
          </p>
        </div>

        <div v-for="col in columns" :key="col.title">
          <h3 class="text-sm font-semibold text-ink">{{ col.title }}</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="link in col.links" :key="link.label">
              <NuxtLink
                :to="link.to"
                class="text-sm text-body transition-colors hover:text-brand-600"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row"
      >
        <p class="text-sm text-body">© {{ year }} aplica. Toate drepturile rezervate.</p>
        <div class="flex items-center gap-4 text-slate-400">
          <a href="#" aria-label="Twitter" class="hover:text-brand-600">
            <Icon name="lucide:twitter" class="size-5" />
          </a>
          <a href="#" aria-label="LinkedIn" class="hover:text-brand-600">
            <Icon name="lucide:linkedin" class="size-5" />
          </a>
          <a href="#" aria-label="GitHub" class="hover:text-brand-600">
            <Icon name="lucide:github" class="size-5" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
