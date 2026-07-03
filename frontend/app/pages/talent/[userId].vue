<script setup lang="ts">
/**
 * Rută veche bazată pe userId. Redirecționează 301 către URL-ul canonic
 * cu slug (/utilizator/nume), pentru a păstra link-urile interne și SEO-ul.
 */
const route = useRoute();
const { $api } = useNuxtApp();
const localePath = useLocalePath();

const { data } = await useAsyncData(`redir-${route.params.userId}`, () =>
  $api<{ slug: string | null }>(`/profiles/freelancers/${route.params.userId}`).catch(() => null),
);

if (data.value?.slug) {
  await navigateTo(localePath(`/utilizator/${data.value.slug}`), {
    redirectCode: 301,
    replace: true,
  });
}
</script>

<template>
  <div class="container-page py-20 text-center">
    <Icon name="lucide:user-x" class="mx-auto size-10 text-slate-300" />
    <p class="mt-3 font-medium text-ink">Freelancer inexistent</p>
    <UiButton to="/talente" variant="outline" class="mt-6">Vezi alți freelanceri</UiButton>
  </div>
</template>
