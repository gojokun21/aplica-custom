<script setup lang="ts">
interface SeoConfig {
  title: string | null;
  description: string | null;
  keywords: string | null;
  ogImageUrl: string | null;
  titleTemplate: string | null;
  noindex: boolean;
}

const route = useRoute();
const config = useRuntimeConfig();

// SEO gestionat din admin, aplicat SSR pentru fiecare rută.
const { data: seo } = await useAsyncData(
  'seo',
  () =>
    $fetch<SeoConfig>('/seo', {
      baseURL: config.public.apiBase as string,
      query: { path: route.path },
    }).catch(() => null),
  { watch: [() => route.path] },
);

useSeoMeta({
  title: () => seo.value?.title || undefined,
  titleTemplate: (title) => {
    const tpl = seo.value?.titleTemplate;
    return tpl && title ? tpl.replace('%s', title as string) : (title as string);
  },
  description: () => seo.value?.description || undefined,
  keywords: () => seo.value?.keywords || undefined,
  ogTitle: () => seo.value?.title || undefined,
  ogDescription: () => seo.value?.description || undefined,
  ogImage: () => seo.value?.ogImageUrl || undefined,
  twitterCard: 'summary_large_image',
  robots: () => (seo.value?.noindex ? 'noindex, nofollow' : undefined),
});
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
