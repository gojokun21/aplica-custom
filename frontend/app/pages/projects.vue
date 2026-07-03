<script setup lang="ts">
// Ruta veche /projects redirecționează permanent la ruta canonică /jobs.
const localePath = useLocalePath();
await navigateTo(localePath('/proiecte'), { redirectCode: 301, replace: true });
</script>

<template>
  <div />
</template>
