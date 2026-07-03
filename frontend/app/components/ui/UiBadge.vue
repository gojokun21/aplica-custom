<script setup lang="ts">
type Variant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'outline';

withDefaults(defineProps<{ variant?: Variant; dot?: boolean }>(), {
  variant: 'neutral',
});

const variants: Record<Variant, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-brand-50 text-brand-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  outline: 'border border-slate-300 text-ink',
};

const dots: Record<Variant, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-600',
  success: 'bg-brand-600',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  outline: 'bg-slate-400',
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="variants[variant]"
  >
    <span v-if="dot" class="size-1.5 rounded-full" :class="dots[variant]" />
    <slot />
  </span>
</template>
