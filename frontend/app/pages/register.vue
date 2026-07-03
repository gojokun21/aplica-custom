<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' });

const { register } = useAuth();

const role = ref<'CLIENT' | 'FREELANCER'>('CLIENT');
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && confirmPassword.value !== password.value,
);

const roles = [
  { value: 'CLIENT', title: 'Sunt client', desc: 'Vreau să angajez', icon: 'lucide:briefcase' },
  { value: 'FREELANCER', title: 'Sunt freelancer', desc: 'Caut de lucru', icon: 'lucide:rocket' },
] as const;

async function onSubmit() {
  error.value = '';
  if (password.value.length < 8) {
    error.value = 'Parola trebuie să aibă minim 8 caractere.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Parolele nu coincid.';
    return;
  }
  loading.value = true;
  try {
    await register({
      role: role.value,
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
    });
    await navigateTo('/dashboard');
  } catch (err: unknown) {
    const msg = (err as { data?: { message?: string | string[] } })?.data?.message;
    error.value = Array.isArray(msg) ? msg[0]! : msg || 'Înregistrare eșuată. Încearcă din nou.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-ink">Creează-ți contul</h1>
    <p class="mt-2 text-sm text-body">
      Ai deja cont?
      <NuxtLink to="/login" class="link">Autentifică-te</NuxtLink>
    </p>

    <UiAlert v-if="error" variant="error" class="mt-6">{{ error }}</UiAlert>

    <!-- Role selector -->
    <div class="mt-6 grid grid-cols-2 gap-3">
      <button
        v-for="r in roles"
        :key="r.value"
        type="button"
        :class="[
          'rounded-xl border p-4 text-left transition-colors',
          role === r.value
            ? 'border-brand-600 bg-brand-50'
            : 'border-slate-300 hover:border-slate-400',
        ]"
        @click="role = r.value"
      >
        <Icon :name="r.icon" :class="role === r.value ? 'text-brand-600' : 'text-slate-400'" class="size-6" />
        <p class="mt-2 font-semibold text-ink">{{ r.title }}</p>
        <p class="text-xs text-body">{{ r.desc }}</p>
      </button>
    </div>

    <form class="mt-5 space-y-4" @submit.prevent="onSubmit">
      <div class="grid grid-cols-2 gap-3">
        <UiInput v-model="firstName" label="Prenume" placeholder="Ana" autocomplete="given-name" required />
        <UiInput v-model="lastName" label="Nume" placeholder="Ionescu" autocomplete="family-name" required />
      </div>
      <UiInput
        v-model="email"
        label="Email"
        type="email"
        icon="lucide:mail"
        placeholder="nume@exemplu.com"
        autocomplete="email"
        required
      />
      <UiInput
        v-model="password"
        label="Parolă"
        type="password"
        icon="lucide:lock"
        placeholder="Minim 8 caractere"
        autocomplete="new-password"
        required
      />
      <UiInput
        v-model="confirmPassword"
        label="Confirmă parola"
        type="password"
        icon="lucide:lock"
        placeholder="Repetă parola"
        autocomplete="new-password"
        required
        :error="passwordMismatch ? 'Parolele nu coincid' : undefined"
      />

      <UiButton type="submit" size="lg" block :loading="loading" :disabled="passwordMismatch">Creează cont</UiButton>

      <p class="text-center text-xs text-body">
        Prin înregistrare, ești de acord cu Termenii și Politica de confidențialitate.
      </p>
    </form>
  </div>
</template>
