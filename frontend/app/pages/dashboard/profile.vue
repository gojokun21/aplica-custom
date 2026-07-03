<script setup lang="ts">
import type { AuthUser } from '~/composables/useAuth';

definePageMeta({ middleware: 'auth' });

interface Skill {
  id: string;
  name: string;
  slug: string;
}

const { user } = useAuth();
const { $api } = useNuxtApp();

const loading = ref(false);
const saved = ref(false);
const error = ref('');

// Avatar
const avatarInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);
const avatarError = ref('');

async function onAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  avatarError.value = '';
  uploadingAvatar.value = true;
  try {
    const form = new FormData();
    form.append('file', file);
    user.value = await $api<AuthUser>('/users/me/avatar', { method: 'POST', body: form });
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    avatarError.value = Array.isArray(msg) ? msg[0]! : msg || 'Încărcarea imaginii a eșuat.';
  } finally {
    uploadingAvatar.value = false;
    input.value = '';
  }
}

async function removeAvatar() {
  uploadingAvatar.value = true;
  try {
    user.value = await $api<AuthUser>('/users/me/avatar', { method: 'DELETE' });
  } catch {
    /* ignore */
  } finally {
    uploadingAvatar.value = false;
  }
}

// Freelancer form
const fTitle = ref('');
const fOverview = ref('');
const fRate = ref<number | undefined>(undefined);
const fCountry = ref('');
const fAvailable = ref(true);
const selectedSkills = ref<Set<string>>(new Set());

// Client form
const cCompany = ref('');
const cDescription = ref('');
const cWebsite = ref('');
const cCountry = ref('');

const { data: skills } = await useAsyncData('all-skills', () =>
  $api<Skill[]>('/skills').catch(() => [] as Skill[]),
);

const { data: profile } = await useAsyncData('edit-profile', () =>
  $api<Record<string, unknown>>('/profiles/me').catch(() => null),
);

watchEffect(() => {
  const p = profile.value as Record<string, unknown> | null;
  if (!p) return;
  if (user.value?.role === 'FREELANCER') {
    fTitle.value = (p.title as string) ?? '';
    fOverview.value = (p.overview as string) ?? '';
    fRate.value = p.hourlyRateCents ? (p.hourlyRateCents as number) / 100 : undefined;
    fCountry.value = (p.countryCode as string) ?? '';
    fAvailable.value = (p.available as boolean) ?? true;
    const sk = (p.skills as Skill[]) ?? [];
    selectedSkills.value = new Set(sk.map((s) => s.id));
  } else if (user.value?.role === 'CLIENT') {
    cCompany.value = (p.companyName as string) ?? '';
    cDescription.value = (p.description as string) ?? '';
    cWebsite.value = (p.website as string) ?? '';
    cCountry.value = (p.countryCode as string) ?? '';
  }
});

function toggleSkill(id: string) {
  const next = new Set(selectedSkills.value);
  next.has(id) ? next.delete(id) : next.add(id);
  selectedSkills.value = next;
}

async function save() {
  error.value = '';
  saved.value = false;
  loading.value = true;
  try {
    if (user.value?.role === 'FREELANCER') {
      await $api('/profiles/freelancer', {
        method: 'PUT',
        body: {
          title: fTitle.value || undefined,
          overview: fOverview.value || undefined,
          hourlyRateCents: fRate.value != null ? Math.round(fRate.value * 100) : undefined,
          countryCode: fCountry.value || undefined,
          available: fAvailable.value,
        },
      });
      await $api('/profiles/freelancer/skills', {
        method: 'PUT',
        body: { skillIds: [...selectedSkills.value] },
      });
    } else if (user.value?.role === 'CLIENT') {
      await $api('/profiles/client', {
        method: 'PUT',
        body: {
          companyName: cCompany.value || undefined,
          description: cDescription.value || undefined,
          website: cWebsite.value || undefined,
          countryCode: cCountry.value || undefined,
        },
      });
    }
    saved.value = true;
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    error.value = Array.isArray(msg) ? msg[0]! : msg || 'Salvarea a eșuat.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="container-page max-w-3xl py-10">
    <NuxtLink to="/dashboard" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Dashboard
    </NuxtLink>
    <h1 class="mt-3 text-2xl font-bold text-ink">Editează profilul</h1>

    <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>
    <UiAlert v-if="saved" variant="success" class="mt-6">Profil salvat cu succes.</UiAlert>

    <!-- Poză de profil -->
    <div class="mt-6 flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <UiAvatar
        :first-name="user?.firstName"
        :last-name="user?.lastName"
        :avatar-url="user?.avatarUrl"
        size="xl"
      />
      <div class="min-w-0">
        <p class="font-semibold text-ink">Poză de profil</p>
        <p class="text-sm text-body">JPG, PNG sau WEBP, maxim 5 MB.</p>
        <UiAlert v-if="avatarError" variant="error" class="mt-2">{{ avatarError }}</UiAlert>
        <div class="mt-3 flex flex-wrap gap-2">
          <UiButton size="sm" :loading="uploadingAvatar" @click="avatarInput?.click()">
            Schimbă poza
          </UiButton>
          <UiButton
            v-if="user?.avatarUrl"
            size="sm"
            variant="outline"
            :disabled="uploadingAvatar"
            @click="removeAvatar"
          >
            Șterge
          </UiButton>
        </div>
        <input
          ref="avatarInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onAvatarSelected"
        />
      </div>
    </div>

    <form class="mt-6 space-y-5" @submit.prevent="save">
      <!-- FREELANCER -->
      <template v-if="user?.role === 'FREELANCER'">
        <UiInput v-model="fTitle" label="Titlu profesional" placeholder="ex. Senior Full-stack Developer" />
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Descriere</label>
          <UiRichText v-model="fOverview" placeholder="Povestește despre experiența ta…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UiInput v-model.number="fRate" label="Tarif orar (EUR)" type="number" icon="lucide:euro" placeholder="50" />
          <UiInput v-model="fCountry" label="Țară (cod ISO)" placeholder="RO" />
        </div>
        <label class="flex items-center gap-3">
          <input v-model="fAvailable" type="checkbox" class="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600" />
          <span class="text-sm text-ink">Disponibil pentru proiecte noi</span>
        </label>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Skill-uri ({{ selectedSkills.size }} selectate)
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in skills"
              :key="s.id"
              type="button"
              :class="[
                'rounded-full border px-3 py-1.5 text-sm transition-colors',
                selectedSkills.has(s.id)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-ink hover:border-brand-500',
              ]"
              @click="toggleSkill(s.id)"
            >
              {{ s.name }}
            </button>
          </div>
        </div>
      </template>

      <!-- CLIENT -->
      <template v-else-if="user?.role === 'CLIENT'">
        <UiInput v-model="cCompany" label="Nume companie" icon="lucide:building-2" placeholder="Acme SRL" />
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Descriere companie</label>
          <UiRichText v-model="cDescription" placeholder="Despre compania ta…" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UiInput v-model="cWebsite" label="Website" icon="lucide:globe" placeholder="https://…" />
          <UiInput v-model="cCountry" label="Țară (cod ISO)" placeholder="RO" />
        </div>
      </template>

      <template v-else>
        <p class="text-body">Contul de admin nu are profil public.</p>
      </template>

      <div v-if="user?.role !== 'ADMIN'" class="pt-2">
        <UiButton type="submit" size="lg" :loading="loading">Salvează modificările</UiButton>
      </div>
    </form>
  </div>
</template>
