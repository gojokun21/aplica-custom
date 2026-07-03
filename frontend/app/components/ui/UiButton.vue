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
  'group/btn inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold ' +
  'transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-ink text-white hover:bg-ink-800',
  outline: 'border border-slate-300 bg-white text-ink hover:border-slate-400 hover:bg-slate-50',
  ghost: 'text-ink hover:bg-slate-100',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[54px] px-7 text-base',
};

const classes = computed(() => [
  base,
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
]);

// Localizează `to` (ex. /register -> /en/register) în funcție de limba activă.
const localePath = useLocalePath();
const resolvedTo = computed(() => (props.to ? localePath(props.to) : undefined));
</script>

<template>
  <NuxtLink v-if="to" :to="resolvedTo" :class="classes">
    <Icon v-if="loading" name="lucide:loader-circle" class="size-4 animate-spin" />
    <slot />
  </NuxtLink>
  <button v-else :type="type" :disabled="disabled || loading" :class="classes">
    <Icon v-if="loading" name="lucide:loader-circle" class="size-4 animate-spin" />
    <slot />
  </button>
</template>
