<script setup lang="ts">
const { locale, locales, setLocale } = useI18n();

const open = ref(false);
const current = computed(() => locales.value.find((l) => l.code === locale.value));

async function choose(code: 'ro' | 'en' | 'ru') {
  await setLocale(code);
  open.value = false;
}
</script>

<template>
  <div class="relative">
    <button
      class="flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink transition-colors hover:bg-slate-100"
      :aria-label="$t('language.label')"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon name="lucide:globe" class="size-[18px] text-slate-500" />
      <span class="uppercase">{{ current?.code }}</span>
      <Icon name="lucide:chevron-down" class="size-3.5 text-slate-400" />
    </button>

    <!-- backdrop pentru închidere la click în afară -->
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false" />

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-if="open"
        class="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop"
      >
        <button
          v-for="l in locales"
          :key="l.code"
          class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100"
          :class="l.code === locale ? 'font-semibold text-brand-700' : 'text-ink'"
          @click="choose(l.code as 'ro' | 'en' | 'ru')"
        >
          {{ l.name }}
          <Icon v-if="l.code === locale" name="lucide:check" class="size-4 text-brand-600" />
        </button>
      </div>
    </Transition>
  </div>
</template>
