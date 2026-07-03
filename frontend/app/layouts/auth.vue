<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <!-- Brand panel — imaginea pe tot fundalul -->
    <div class="relative hidden overflow-hidden lg:block">
      <img src="/auth.webp" alt="" class="absolute inset-0 size-full object-cover" />
      <!-- Scrim pentru lizibilitatea textului alb -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/45" />

      <div class="relative flex h-full flex-col justify-between p-12">
        <NuxtLink to="/" class="flex items-center" aria-label="aplica — acasă">
          <img src="/logo.png" alt="aplica" class="h-10 w-auto invert" width="200" height="100" />
        </NuxtLink>

        <div>
          <h2 class="max-w-md text-3xl font-bold leading-snug text-white drop-shadow">
            Locul unde talentul întâlnește oportunitatea.
          </h2>
          <p class="mt-4 max-w-md text-white/85 drop-shadow">
            Alătură-te comunității de freelanceri și clienți care construiesc împreună.
          </p>
        </div>

        <p class="text-sm text-white/70">© {{ new Date().getFullYear() }} aplica</p>
      </div>
    </div>

    <!-- Form area -->
    <div class="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
      <NuxtLink to="/" class="mb-8 flex items-center lg:hidden" aria-label="aplica — acasă">
        <img src="/logo.png" alt="aplica" class="h-9 w-auto" width="180" height="90" />
      </NuxtLink>
      <div class="mx-auto w-full max-w-md">
        <slot />
      </div>
    </div>
  </div>
</template>
