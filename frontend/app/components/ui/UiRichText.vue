<script setup lang="ts">
import Editor from '@tinymce/tinymce-vue';

const model = defineModel<string>({ default: '' });
const props = withDefaults(
  defineProps<{ placeholder?: string; height?: number; full?: boolean }>(),
  { height: 260, full: false },
);

const init = computed(() => ({
  height: props.height,
  menubar: false,
  branding: false,
  promotion: false,
  statusbar: false,
  placeholder: props.placeholder,
  plugins: 'lists link autolink',
  toolbar: props.full
    ? 'blocks | bold italic underline | bullist numlist | link blockquote | removeformat'
    : 'bold italic underline | bullist numlist | link | removeformat',
  block_formats: 'Paragraf=p; Titlu 1=h1; Titlu 2=h2; Titlu 3=h3',
  skin: 'oxide',
  content_css: 'default',
  content_style: 'body{font-family:Inter,system-ui,sans-serif;font-size:14px}',
}));
</script>

<template>
  <ClientOnly>
    <Editor
      v-model="model"
      license-key="gpl"
      tinymce-script-src="/tinymce/tinymce.min.js"
      :init="init"
    />
    <template #fallback>
      <div
        class="animate-pulse rounded-xl border border-slate-300 bg-slate-50"
        :style="{ height: `${height}px` }"
      />
    </template>
  </ClientOnly>
</template>
