<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'error' | 'success' | 'info' }>(), { variant: 'info' });

const styles = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success:
    'border-brand-200 bg-brand-50 text-brand-700',
  info: 'border-slate-200 bg-slate-50 text-slate-700',
};
const icons = {
  error: 'lucide:circle-alert',
  success: 'lucide:circle-check',
  info: 'lucide:info',
};
</script>

<template>
  <div :class="['flex items-start gap-2.5 rounded-xl border p-3 text-sm', styles[variant]]">
    <Icon :name="icons[variant]" class="mt-0.5 size-4.5 shrink-0" />
    <div><slot /></div>
  </div>
</template>
