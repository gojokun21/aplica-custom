<script setup lang="ts">
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const props = withDefaults(
  defineProps<{
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    size?: Size;
  }>(),
  { size: 'md' },
);

const config = useRuntimeConfig();

const src = computed(() => {
  const u = props.avatarUrl;
  if (!u) return null;
  return u.startsWith('http') ? u : `${config.public.apiBase}${u}`;
});

const initials = computed(
  () => (props.firstName?.[0] ?? '') + (props.lastName?.[0] ?? ''),
);

const sizeClass: Record<Size, string> = {
  xs: 'size-7 text-[10px]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
};
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="`${firstName} ${lastName}`"
    :class="['shrink-0 rounded-full object-cover', sizeClass[size]]"
  />
  <span
    v-else
    :class="[
      'flex shrink-0 items-center justify-center rounded-full bg-brand-600 font-bold uppercase text-white',
      sizeClass[size],
    ]"
  >
    {{ initials }}
  </span>
</template>
