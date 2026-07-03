<script setup lang="ts">
interface Skill {
  id: string;
  name: string;
  slug: string;
}

const { $api } = useNuxtApp();

const { data: skills } = await useAsyncData('home-skills', () =>
  $api<Skill[]>('/skills').catch(() => [] as Skill[]),
);
const topSkills = computed(() => (skills.value ?? []).slice(0, 12));

const localePath = useLocalePath();
const search = ref('');
function onSearch() {
  return navigateTo(localePath({ path: '/talente', query: search.value ? { q: search.value } : {} }));
}

const domains = [
  { nameKey: 'home.explore.domains.web', hintKey: 'home.explore.domains.webHint', icon: 'lucide:code-xml' },
  { nameKey: 'home.explore.domains.design', hintKey: 'home.explore.domains.designHint', icon: 'lucide:pen-tool' },
  { nameKey: 'home.explore.domains.mobile', hintKey: 'home.explore.domains.mobileHint', icon: 'lucide:smartphone' },
  { nameKey: 'home.explore.domains.data', hintKey: 'home.explore.domains.dataHint', icon: 'lucide:brain-circuit' },
  { nameKey: 'home.explore.domains.marketing', hintKey: 'home.explore.domains.marketingHint', icon: 'lucide:megaphone' },
  { nameKey: 'home.explore.domains.content', hintKey: 'home.explore.domains.contentHint', icon: 'lucide:pen-line' },
];

const steps = [
  { n: '01', titleKey: 'home.steps.s1Title', textKey: 'home.steps.s1Text' },
  { n: '02', titleKey: 'home.steps.s2Title', textKey: 'home.steps.s2Text' },
  { n: '03', titleKey: 'home.steps.s3Title', textKey: 'home.steps.s3Text' },
];

const clientBullets = ['home.fork.client.b1', 'home.fork.client.b2', 'home.fork.client.b3'];
const freelancerBullets = ['home.fork.freelancer.b1', 'home.fork.freelancer.b2', 'home.fork.freelancer.b3'];
</script>

<template>
  <div>
    <!-- ============================ HERO (video, editorial) ============== -->
    <section class="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <video
        class="absolute inset-0 size-full object-cover"
        autoplay
        muted
        loop
        playsinline
        preload="auto"
        poster="/hero-poster.svg"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <!-- Overlay în ton de brand: întunecă marginile, lasă mijlocul viu, întărește textul din stânga -->
      <div class="absolute inset-0 bg-linear-to-b from-ink/75 via-ink/30 to-ink/85" />
      <div class="absolute inset-0 bg-linear-to-r from-ink/80 via-ink/20 to-transparent" />

      <div class="container-page relative py-24">
        <div class="max-w-2xl">
          <p class="flex items-center gap-2 text-sm font-medium text-white/80">
            <span class="size-1.5 rounded-full bg-brand-300" />
            {{ $t('home.hero.badge') }}
          </p>

          <h1 class="mt-5 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.02em] text-white sm:text-6xl lg:text-[4.25rem]">
            {{ $t('home.hero.title') }}
            <span class="italic text-brand-300">{{ $t('home.hero.titleAccent') }}</span>.
          </h1>

          <p class="mt-6 max-w-xl text-lg leading-relaxed text-white/85">
            {{ $t('home.hero.subtitle') }}
          </p>

          <form
            class="mt-9 flex max-w-lg items-center gap-1.5 rounded-2xl border border-white/15 bg-white p-1.5 pl-4 shadow-pop"
            @submit.prevent="onSearch"
          >
            <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="$t('common.searchPlaceholder')"
              :aria-label="$t('home.hero.searchAria')"
              class="h-10 w-full bg-transparent text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0"
            />
            <UiButton type="submit" size="md" class="shrink-0">{{ $t('common.search') }}</UiButton>
          </form>

          <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/75">
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:circle-check" class="size-4 text-brand-300" /> {{ $t('home.hero.trustFree') }}
            </span>
            <span class="inline-flex items-center gap-2">
              <Icon name="lucide:map-pin" class="size-4 text-brand-300" /> {{ $t('home.hero.trustLocal') }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== FORK: client vs freelancer ================== -->
    <section class="container-page py-20 lg:py-28">
      <div class="max-w-2xl">
        <p class="eyebrow">{{ $t('home.fork.eyebrow') }}</p>
        <h2 class="mt-3 font-display text-3xl font-semibold sm:text-[2.5rem] sm:leading-[1.1]">
          {{ $t('home.fork.title') }}
        </h2>
      </div>

      <div class="mt-12 grid gap-5 lg:grid-cols-2">
        <!-- Client -->
        <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-card transition-shadow duration-200 hover:shadow-pop lg:p-10">
          <span class="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="lucide:briefcase" class="size-6" />
          </span>
          <h3 class="mt-6 text-2xl font-semibold text-ink">{{ $t('home.fork.client.title') }}</h3>
          <p class="mt-3 max-w-md flex-1 text-body">
            {{ $t('home.fork.client.text') }}
          </p>
          <ul class="mt-6 space-y-2.5 text-sm text-ink">
            <li v-for="t in clientBullets" :key="t" class="flex items-center gap-2.5">
              <Icon name="lucide:check" class="size-4 shrink-0 text-brand-600" /> {{ $t(t) }}
            </li>
          </ul>
          <div class="mt-8">
            <UiButton to="/register" size="lg">
              {{ $t('home.fork.client.cta') }} <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </UiButton>
          </div>
        </article>

        <!-- Freelancer -->
        <article class="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-ink p-8 shadow-card transition-shadow duration-200 hover:shadow-pop lg:p-10">
          <span class="inline-flex size-12 items-center justify-center rounded-xl bg-white/10 text-brand-300">
            <Icon name="lucide:rocket" class="size-6" />
          </span>
          <h3 class="mt-6 text-2xl font-semibold text-white">{{ $t('home.fork.freelancer.title') }}</h3>
          <p class="mt-3 max-w-md flex-1 text-white/75">
            {{ $t('home.fork.freelancer.text') }}
          </p>
          <ul class="mt-6 space-y-2.5 text-sm text-white/90">
            <li v-for="t in freelancerBullets" :key="t" class="flex items-center gap-2.5">
              <Icon name="lucide:check" class="size-4 shrink-0 text-brand-300" /> {{ $t(t) }}
            </li>
          </ul>
          <div class="mt-8">
            <UiButton to="/register" size="lg" class="bg-white! text-ink! hover:bg-white/90!">
              {{ $t('home.fork.freelancer.cta') }} <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </UiButton>
          </div>
        </article>
      </div>
    </section>

    <!-- ========================= EXPLORE EXPERTISE ====================== -->
    <section class="border-y border-slate-200 bg-slate-50">
      <div class="container-page py-20 lg:py-24">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div class="max-w-xl">
            <p class="eyebrow">{{ $t('home.explore.eyebrow') }}</p>
            <h2 class="mt-3 font-display text-3xl font-semibold sm:text-[2.25rem]">
              {{ $t('home.explore.title') }}
            </h2>
          </div>
          <NuxtLinkLocale to="/talente" class="link text-[15px]">{{ $t('common.viewAllTalent') }} →</NuxtLinkLocale>
        </div>

        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <NuxtLinkLocale
            v-for="d in domains"
            :key="d.nameKey"
            to="/talente"
            class="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop"
          >
            <span class="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-100">
              <Icon :name="d.icon" class="size-5" />
            </span>
            <span class="min-w-0">
              <span class="block font-semibold text-ink">{{ $t(d.nameKey) }}</span>
              <span class="block truncate text-sm text-body">{{ $t(d.hintKey) }}</span>
            </span>
            <Icon name="lucide:arrow-up-right" class="ml-auto size-4 shrink-0 text-slate-400 transition-all duration-150 group-hover:text-brand-600" />
          </NuxtLinkLocale>
        </div>

        <div v-if="topSkills.length" class="mt-10 flex flex-wrap items-center gap-2.5">
          <span class="text-sm font-medium text-body">{{ $t('home.explore.popular') }}</span>
          <NuxtLinkLocale
            v-for="skill in topSkills"
            :key="skill.id"
            :to="{ path: '/talente', query: { skill: skill.slug } }"
            class="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-ink transition-colors duration-150 hover:border-brand-600 hover:text-brand-700"
          >
            {{ skill.name }}
          </NuxtLinkLocale>
        </div>
      </div>
    </section>

    <!-- ============================ HOW IT WORKS ======================== -->
    <section id="how" class="container-page py-20 lg:py-28">
      <div class="max-w-2xl">
        <p class="eyebrow">{{ $t('home.steps.eyebrow') }}</p>
        <h2 class="mt-3 font-display text-3xl font-semibold sm:text-[2.5rem]">
          {{ $t('home.steps.title') }}
        </h2>
      </div>

      <div class="mt-14 grid gap-x-8 gap-y-12 md:grid-cols-3">
        <div v-for="(step, i) in steps" :key="step.n" class="relative">
          <span class="font-display text-5xl font-semibold text-brand-600/25">{{ step.n }}</span>
          <div class="mt-3 h-px w-full bg-slate-200">
            <div class="h-px bg-brand-600" :style="{ width: `${(i + 1) * 33}%` }" />
          </div>
          <h3 class="mt-5 text-xl font-semibold text-ink">{{ $t(step.titleKey) }}</h3>
          <p class="mt-2 text-body">{{ $t(step.textKey) }}</p>
        </div>
      </div>
    </section>

    <!-- ============================ CLOSING BAND ======================== -->
    <section class="container-page pb-24">
      <div class="relative overflow-hidden rounded-[1.75rem] bg-ink px-8 py-16 sm:px-14 lg:px-20">
        <div class="relative max-w-2xl">
          <p class="eyebrow text-brand-300">{{ $t('home.closing.eyebrow') }}</p>
          <h2 class="mt-4 font-display text-3xl font-semibold text-white sm:text-[2.5rem] sm:leading-[1.1]">
            {{ $t('home.closing.title') }}
          </h2>
          <p class="mt-4 max-w-xl text-white/70">
            {{ $t('home.closing.text') }}
          </p>
          <div class="mt-9 flex flex-wrap gap-3">
            <UiButton to="/register" size="lg" class="bg-white! text-ink! hover:bg-white/90!">
              {{ $t('common.createFreeAccount') }}
            </UiButton>
            <UiButton to="/talente" size="lg" variant="ghost" class="text-white! hover:bg-white/10!">
              {{ $t('common.exploreTalent') }}
            </UiButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
