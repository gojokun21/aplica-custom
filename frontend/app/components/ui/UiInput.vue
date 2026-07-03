<script setup lang="ts">
const model = defineModel<string>();
defineProps<{
  label?: string;
  type?: string;
  placeholder?: string;
  icon?: string;
  autocomplete?: string;
  required?: boolean;
  error?: string;
}>();
const id = useId();
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="mb-1.5 block text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <div class="relative">
      <Icon
        v-if="icon"
        :name="icon"
        class="pointer-events-none absolute left-3 top-1/2 size-4.5 -translate-y-1/2 text-slate-400"
      />
      <input
        :id="id"
        v-model="model"
        :type="type ?? 'text'"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :class="[
          'h-11 w-full rounded-xl border bg-white text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
          icon ? 'pl-10 pr-3.5' : 'px-3.5',
          error ? 'border-red-400' : 'border-slate-300',
        ]"
      />
    </div>
    <p v-if="error" class="mt-1.5 text-xs text-red-600">{{ error }}</p>
  </div>
</template>
