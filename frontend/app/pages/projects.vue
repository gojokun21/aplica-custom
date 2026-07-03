<script setup lang="ts">
// Ruta veche /projects redirecționează permanent la ruta canonică /jobs.
await navigateTo('/jobs', { redirectCode: 301, replace: true });
</script>

<template>
  <div />
</template>
