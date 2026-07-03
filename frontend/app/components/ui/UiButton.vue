<script setup lang="ts">
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const props = withDefaults(
  defineProps<{
    to?: string;
    type?: 'button' | 'submit';
    variant?: Variant;
    size?: Size;
    block?: boolean;
    loading?: boolean;
    disabled?: boolean;
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
);

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-ink text-white hover:bg-ink-800',
  outline:
    'border border-brand-600 bg-transparent text-brand-700 hover:bg-brand-50',
  ghost: 'text-ink hover:bg-slate-100',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-[52px] px-8 text-base',
};

const classes = computed(() => [
  base,
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
]);
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <Icon v-if="loading" name="lucide:loader-circle" class="size-4 animate-spin" />
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="classes">
    <Icon v-if="loading" name="lucide:loader-circle" class="size-4 animate-spin" />
    <slot />
  </button>
</template>
