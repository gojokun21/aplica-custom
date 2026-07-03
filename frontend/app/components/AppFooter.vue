<script setup lang="ts">
const year = new Date().getFullYear();

const columns = [
  {
    titleKey: 'footer.forClients',
    links: [
      { labelKey: 'footer.links.howToHire', to: '/#how' },
      { labelKey: 'footer.links.findTalent', to: '/talente' },
      { labelKey: 'footer.links.postProject', to: '/proiecte/nou' },
    ],
  },
  {
    titleKey: 'footer.forFreelancers',
    links: [
      { labelKey: 'footer.links.howToEarn', to: '/#how' },
      { labelKey: 'footer.links.findProjects', to: '/proiecte' },
      { labelKey: 'footer.links.createProfile', to: '/register' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'footer.links.about', to: '/' },
      { labelKey: 'footer.links.contact', to: '/' },
      { labelKey: 'footer.links.terms', to: '/terms' },
      { labelKey: 'footer.links.privacy', to: '/privacy' },
    ],
  },
];
</script>

<template>
  <footer class="border-t border-slate-200 bg-canvas">
    <div class="container-page py-16">
      <div class="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
        <div class="lg:col-span-2">
          <img src="/logo.png" alt="aplica" class="h-9 w-auto" width="180" height="90" />
          <p class="mt-5 max-w-xs text-sm leading-relaxed text-body">
            {{ $t('footer.tagline') }}
          </p>
          <span class="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            <span class="size-1.5 rounded-full bg-brand-600" /> {{ $t('footer.testingBadge') }}
          </span>
        </div>

        <div v-for="col in columns" :key="col.titleKey">
          <h3 class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{{ $t(col.titleKey) }}</h3>
          <ul class="mt-4 space-y-3">
            <li v-for="link in col.links" :key="link.labelKey">
              <NuxtLinkLocale
                :to="link.to"
                class="text-sm text-body transition-colors duration-150 hover:text-brand-700"
              >
                {{ $t(link.labelKey) }}
              </NuxtLinkLocale>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row"
      >
        <p class="text-sm text-body">© {{ year }} {{ $t('footer.copyright') }}</p>
        <div class="flex items-center gap-1">
          <a href="#" aria-label="Facebook" class="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700">
            <Icon name="lucide:facebook" class="size-[18px]" />
          </a>
          <a href="#" aria-label="Instagram" class="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700">
            <Icon name="lucide:instagram" class="size-[18px]" />
          </a>
          <a href="#" aria-label="LinkedIn" class="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-700">
            <Icon name="lucide:linkedin" class="size-[18px]" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
