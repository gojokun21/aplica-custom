<script setup lang="ts">
/** Suprafață de bază a design system-ului. Devine link dacă primește `to`. */
const props = withDefaults(
  defineProps<{
    to?: string;
    interactive?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
  }>(),
  { padding: 'md' },
);

const pads: Record<NonNullable<typeof props.padding>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const classes = computed(() => [
  'rounded-2xl border border-slate-200 bg-white shadow-card',
  pads[props.padding],
  props.interactive || props.to
    ? 'transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-pop'
    : '',
]);

const localePath = useLocalePath();
const resolvedTo = computed(() => (props.to ? localePath(props.to) : undefined));
</script>

<template>
  <NuxtLink v-if="to" :to="resolvedTo" :class="classes">
    <slot />
  </NuxtLink>
  <div v-else :class="classes">
    <slot />
  </div>
</template>
