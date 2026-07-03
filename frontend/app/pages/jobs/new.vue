<script setup lang="ts">
definePageMeta({ middleware: ['auth', 'client-only'] });

interface Skill { id: string; name: string; slug: string }

const { $api } = useNuxtApp();

const title = ref('');
const description = ref('');
const budgetType = ref<'FIXED' | 'HOURLY'>('FIXED');
const budget = ref<number | undefined>(undefined);
const minRate = ref<number | undefined>(undefined);
const maxRate = ref<number | undefined>(undefined);
const selectedSkills = ref<Set<string>>(new Set());
const loading = ref(false);
const error = ref('');

const { data: skills } = await useAsyncData('new-job-skills', () =>
  $api<Skill[]>('/skills').catch(() => [] as Skill[]),
);

function toggleSkill(id: string) {
  const next = new Set(selectedSkills.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedSkills.value = next;
}

async function submit() {
  error.value = '';
  if (!description.value.replace(/<[^>]*>/g, '').trim()) {
    error.value = 'Adaugă o descriere.';
    return;
  }
  loading.value = true;
  try {
    const body: Record<string, unknown> = {
      title: title.value,
      description: description.value,
      budgetType: budgetType.value,
      skillIds: [...selectedSkills.value],
    };
    if (budgetType.value === 'FIXED') {
      body.budgetCents = budget.value != null ? Math.round(budget.value * 100) : undefined;
    } else {
      body.minRateCents = minRate.value != null ? Math.round(minRate.value * 100) : undefined;
      body.maxRateCents = maxRate.value != null ? Math.round(maxRate.value * 100) : undefined;
    }
    const job = await $api<{ id: string }>('/jobs', { method: 'POST', body });
    await navigateTo(`/jobs/${job.id}`);
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    error.value = Array.isArray(msg) ? msg[0]! : msg || 'Crearea anunțului a eșuat.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container-page max-w-3xl py-10">
    <NuxtLink to="/jobs" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Proiecte
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Postează un proiect nou</h1>

    <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>

    <form class="mt-6 space-y-5" @submit.prevent="submit">
      <UiInput v-model="title" label="Titlu" placeholder="ex. Construire API cu NestJS" required />

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">Descriere</label>
        <UiRichText v-model="description" placeholder="Descrie ce ai nevoie, livrabile, termene…" :height="200" />
      </div>

      <!-- Budget type -->
      <div>
        <label class="mb-2 block text-sm font-medium text-slate-700">Tip buget</label>
        <div class="grid grid-cols-2 gap-3">
          <button type="button" :class="['rounded-xl border p-4 text-left transition-colors', budgetType === 'FIXED' ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:border-slate-400']" @click="budgetType = 'FIXED'">
            <Icon name="lucide:banknote" :class="budgetType === 'FIXED' ? 'text-brand-600' : 'text-slate-400'" class="size-6" />
            <p class="mt-2 font-semibold text-ink">Preț fix</p>
            <p class="text-xs text-body">O sumă totală pentru proiect</p>
          </button>
          <button type="button" :class="['rounded-xl border p-4 text-left transition-colors', budgetType === 'HOURLY' ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:border-slate-400']" @click="budgetType = 'HOURLY'">
            <Icon name="lucide:clock" :class="budgetType === 'HOURLY' ? 'text-brand-600' : 'text-slate-400'" class="size-6" />
            <p class="mt-2 font-semibold text-ink">Tarif orar</p>
            <p class="text-xs text-body">Un interval de tarif pe oră</p>
          </button>
        </div>
      </div>

      <UiInput v-if="budgetType === 'FIXED'" v-model.number="budget" label="Buget total (EUR)" type="number" icon="lucide:euro" placeholder="ex. 2500" required />
      <div v-else class="grid grid-cols-2 gap-4">
        <UiInput v-model.number="minRate" label="Tarif minim (EUR/h)" type="number" icon="lucide:euro" placeholder="30" required />
        <UiInput v-model.number="maxRate" label="Tarif maxim (EUR/h)" type="number" icon="lucide:euro" placeholder="60" required />
      </div>

      <div>
        <label class="mb-2 block text-sm font-medium text-slate-700">Skill-uri cerute ({{ selectedSkills.size }})</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="s in skills" :key="s.id" type="button" :class="['rounded-full border px-3 py-1.5 text-sm transition-colors', selectedSkills.has(s.id) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-ink hover:border-brand-500']" @click="toggleSkill(s.id)">{{ s.name }}</button>
        </div>
      </div>

      <div class="pt-2">
        <UiButton type="submit" size="lg" :loading="loading">Publică proiectul</UiButton>
      </div>
    </form>
  </div>
</template>
