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
const topSkills = computed(() => (skills.value ?? []).slice(0, 14));

const search = ref('');
function onSearch() {
  return navigateTo({ path: '/talent', query: search.value ? { q: search.value } : {} });
}

const categories = [
  { name: 'Dezvoltare web', icon: 'lucide:code-xml', jobs: '3.240' },
  { name: 'Design & UI/UX', icon: 'lucide:palette', jobs: '1.820' },
  { name: 'Aplicații mobile', icon: 'lucide:smartphone', jobs: '940' },
  { name: 'DevOps & Cloud', icon: 'lucide:cloud', jobs: '610' },
  { name: 'Data & AI', icon: 'lucide:database', jobs: '1.130' },
  { name: 'Marketing', icon: 'lucide:megaphone', jobs: '2.010' },
  { name: 'Copywriting', icon: 'lucide:pen-line', jobs: '870' },
  { name: 'Video & Motion', icon: 'lucide:clapperboard', jobs: '430' },
];

const clientSteps = [
  { n: '01', title: 'Postează proiectul', text: 'Descrie ce ai nevoie în câteva minute. Gratuit și fără obligații.' },
  { n: '02', title: 'Primește propuneri', text: 'Freelanceri verificați aplică cu portofoliu și tarife clare.' },
  { n: '03', title: 'Colaborați direct', text: 'Discutați detaliile în chat și stabiliți colaborarea direct, fără intermediari.' },
];

const features = [
  { icon: 'lucide:badge-check', title: 'Talent verificat', text: 'Identitate și skill-uri verificate pentru fiecare freelancer.' },
  { icon: 'lucide:messages-square', title: 'Comunicare directă', text: 'Chat în timp real cu freelancerii, ca să stabiliți termenii împreună.' },
  { icon: 'lucide:sparkles', title: 'Potrivire rapidă', text: 'Recomandări relevante pentru proiectul tău, în minute.' },
  { icon: 'lucide:headset', title: 'Suport dedicat', text: 'O echipă reală te ajută la fiecare pas, oricând.' },
];
</script>

<template>
  <div>
    <!-- ============================== HERO (full-screen video) ========== -->
    <section class="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <!-- Video pe fundal -->
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
      <!-- Overlay negru transparent doar sus și jos (video vizibil la mijloc) -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/15 to-black/70" />

      <!-- Conținut -->
      <div class="container-page relative py-20 text-center">
        <h1 class="mx-auto max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-sm sm:text-6xl lg:text-7xl">
          Cum vrei tu să muncești, <span class="text-brand-400">pe bune</span>.
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-white/90 sm:text-xl">
          Conectăm clienți cu freelanceri de top din development, design și marketing.
          Postează un proiect sau găsește-ți următorul job.
        </p>

        <form
          class="mx-auto mt-10 flex max-w-xl items-center gap-2 rounded-full border border-white/30 bg-white/95 p-1.5 pl-5 shadow-pop backdrop-blur focus-within:border-brand-600"
          @submit.prevent="onSearch"
        >
          <Icon name="lucide:search" class="size-5 shrink-0 text-slate-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Caută: React, UI/UX, copywriting…"
            class="h-10 w-full bg-transparent text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus-visible:ring-0"
          />
          <UiButton type="submit" size="md" class="shrink-0">Caută</UiButton>
        </form>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <UiButton to="/register" size="lg">Începe gratuit</UiButton>
          <UiButton to="/talent" variant="outline" size="lg" class="border-white/50 text-white hover:bg-white/10">
            Explorează talente
          </UiButton>
        </div>

        <div class="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:circle-check" class="size-4 text-brand-400" /> Fără costuri de înscriere
          </span>
          <span class="inline-flex items-center gap-2">
            <Icon name="lucide:circle-check" class="size-4 text-brand-400" /> Talent verificat
          </span>
        </div>
      </div>

      <!-- Indiciu de scroll -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Icon name="lucide:chevron-down" class="size-7 animate-bounce text-white/60" />
      </div>
    </section>

    <!-- ============================ CATEGORIES ========================== -->
    <section class="container-page py-16 lg:py-20">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold sm:text-[2rem]">Explorează pe categorii</h2>
          <p class="mt-2 text-body">Găsește experți în domeniul de care ai nevoie.</p>
        </div>
        <NuxtLink to="/talent" class="link text-[15px]">Vezi toate categoriile</NuxtLink>
      </div>

      <div class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        <NuxtLink
          v-for="c in categories"
          :key="c.name"
          to="/talent"
          class="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-pop"
        >
          <Icon :name="c.icon" class="size-7 text-brand-600" />
          <h3 class="mt-4 font-semibold text-ink">{{ c.name }}</h3>
          <p class="mt-1 text-sm text-body">{{ c.jobs }} freelanceri</p>
        </NuxtLink>
      </div>

      <div v-if="topSkills.length" class="mt-8 flex flex-wrap items-center gap-2.5">
        <span class="text-sm font-medium text-body">Skill-uri populare:</span>
        <NuxtLink
          v-for="skill in topSkills"
          :key="skill.id"
          :to="{ path: '/talent', query: { skill: skill.slug } }"
          class="rounded-full border border-slate-300 px-3.5 py-1.5 text-sm text-ink transition-colors hover:border-brand-600 hover:text-brand-700"
        >
          {{ skill.name }}
        </NuxtLink>
      </div>
    </section>

    <!-- ================= DARK GREEN SECTION (semnătură) ================= -->
    <section class="bg-ink">
      <div class="container-page py-16 lg:py-24">
        <h2 class="max-w-2xl text-3xl font-bold text-white sm:text-4xl">
          Găsește-ți modul tău de a lucra pe aplica
        </h2>

        <div class="mt-10 grid gap-5 md:grid-cols-2">
          <div class="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <Icon name="lucide:briefcase" class="size-8 text-brand-400" />
            <h3 class="mt-5 text-2xl font-bold text-white">Sunt client</h3>
            <p class="mt-2 flex-1 text-white/70">
              Angajează experți pentru orice proiect, mare sau mic. Postezi, primești propuneri și
              alegi cei mai buni.
            </p>
            <div class="mt-6">
              <UiButton to="/register" size="md">Angajează talente</UiButton>
            </div>
          </div>

          <div class="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <Icon name="lucide:rocket" class="size-8 text-brand-400" />
            <h3 class="mt-5 text-2xl font-bold text-white">Sunt freelancer</h3>
            <p class="mt-2 flex-1 text-white/70">
              Găsește proiecte care ți se potrivesc, colaborează cu clienți serioși și încasează la
              timp, în siguranță.
            </p>
            <div class="mt-6">
              <UiButton to="/register" variant="outline" size="md" class="border-white/40 text-white hover:bg-white/10">
                Găsește de lucru
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================== HOW IT WORKS ========================= -->
    <section id="how" class="container-page py-16 lg:py-20">
      <div class="max-w-2xl">
        <h2 class="text-3xl font-bold sm:text-[2rem]">Cum funcționează</h2>
        <p class="mt-2 text-body">De la idee la livrare în trei pași simpli.</p>
      </div>

      <div class="mt-10 grid gap-8 md:grid-cols-3">
        <div v-for="step in clientSteps" :key="step.n" class="border-t-2 border-brand-600 pt-5">
          <span class="text-sm font-bold text-brand-600">{{ step.n }}</span>
          <h3 class="mt-2 text-lg font-semibold text-ink">{{ step.title }}</h3>
          <p class="mt-2 text-body">{{ step.text }}</p>
        </div>
      </div>
    </section>

    <!-- ============================= FEATURES =========================== -->
    <section class="border-y border-slate-100 bg-slate-50 py-16 lg:py-20">
      <div class="container-page">
        <div class="max-w-2xl">
          <h2 class="text-3xl font-bold sm:text-[2rem]">De ce aplica</h2>
          <p class="mt-2 text-body">Am construit o platformă în care încrederea nu e opțională.</p>
        </div>
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="f in features"
            :key="f.title"
            class="rounded-xl border border-slate-200 bg-white p-6"
          >
            <Icon :name="f.icon" class="size-7 text-brand-600" />
            <h3 class="mt-4 font-semibold text-ink">{{ f.title }}</h3>
            <p class="mt-1.5 text-sm text-body">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- =============================== CTA ============================== -->
    <section class="container-page py-16 lg:py-24">
      <div class="flex flex-col items-start justify-between gap-6 rounded-2xl bg-brand-600 px-8 py-12 sm:px-14 lg:flex-row lg:items-center">
        <div>
          <h2 class="text-3xl font-bold text-white sm:text-4xl">Gata să începi?</h2>
          <p class="mt-2 max-w-xl text-white/85">
            Alătură-te miilor de clienți și freelanceri de pe aplica. Contul e gratuit.
          </p>
        </div>
        <UiButton to="/register" variant="secondary" size="lg" class="shrink-0">
          Creează cont gratuit <Icon name="lucide:arrow-right" class="size-4" />
        </UiButton>
      </div>
    </section>
  </div>
</template>
