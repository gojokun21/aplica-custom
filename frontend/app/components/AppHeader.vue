<script setup lang="ts">
const { isLoggedIn, user, logout } = useAuth();
const { items: notifications, notifUnread, msgUnread, markRead, markAllRead, reset } =
  useNotifications();

const mobileOpen = ref(false);
const menuOpen = ref(false);
const bellOpen = ref(false);
const route = useRoute();

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
    menuOpen.value = false;
    bellOpen.value = false;
  },
);

const nav = [
  { label: 'Găsește talente', to: '/talent' },
  { label: 'Găsește proiecte', to: '/jobs' },
  { label: 'Cum funcționează', to: '/#how' },
];

async function onNotifClick(n: { id: string; link: string | null }) {
  await markRead(n.id);
  bellOpen.value = false;
  if (n.link) await navigateTo(n.link);
}

async function onLogout() {
  reset();
  await logout();
  await navigateTo('/');
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-slate-200 bg-white">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <div class="flex items-center gap-8">
        <NuxtLink to="/" class="flex items-center" aria-label="aplica — acasă">
          <img src="/logo.png" alt="aplica" class="h-9 w-auto" width="180" height="90" />
        </NuxtLink>

        <nav class="hidden items-center gap-6 md:flex">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="text-[15px] font-medium text-ink/80 transition-colors hover:text-brand-600"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-3">
        <!-- Mesaje + Clopoțel (doar autentificat) -->
        <template v-if="isLoggedIn">
          <NuxtLink
            to="/messages"
            class="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            aria-label="Mesaje"
          >
            <Icon name="lucide:message-square" class="size-[18px]" />
            <span
              v-if="msgUnread > 0"
              class="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white"
            >
              {{ msgUnread > 9 ? '9+' : msgUnread }}
            </span>
          </NuxtLink>

          <div class="relative">
            <button
              class="relative flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
              aria-label="Notificări"
              @click="bellOpen = !bellOpen"
            >
              <Icon name="lucide:bell" class="size-[18px]" />
              <span
                v-if="notifUnread > 0"
                class="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              >
                {{ notifUnread > 9 ? '9+' : notifUnread }}
              </span>
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              leave-active-class="transition duration-100 ease-in"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="bellOpen"
                class="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop"
              >
                <div class="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <p class="text-sm font-semibold text-ink">Notificări</p>
                  <button
                    v-if="notifUnread > 0"
                    class="text-xs font-medium text-brand-600 hover:text-brand-700"
                    @click="markAllRead"
                  >
                    Marchează toate citite
                  </button>
                </div>
                <div class="max-h-96 overflow-y-auto">
                  <p v-if="notifications.length === 0" class="px-4 py-8 text-center text-sm text-body">
                    Nicio notificare
                  </p>
                  <button
                    v-for="n in notifications"
                    :key="n.id"
                    class="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 last:border-0"
                    :class="n.readAt ? '' : 'bg-brand-50/40'"
                    @click="onNotifClick(n)"
                  >
                    <span
                      class="mt-1.5 size-2 shrink-0 rounded-full"
                      :class="n.readAt ? 'bg-transparent' : 'bg-brand-600'"
                    />
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-ink">{{ n.title }}</span>
                      <span v-if="n.body" class="block truncate text-xs text-body">{{ n.body }}</span>
                    </span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </template>

        <template v-if="!isLoggedIn">
          <NuxtLink
            to="/login"
            class="hidden text-[15px] font-semibold text-ink transition-colors hover:text-brand-600 sm:block"
          >
            Autentificare
          </NuxtLink>
          <UiButton to="/register" size="sm">Înscrie-te</UiButton>
        </template>

        <template v-else>
          <div class="relative">
            <button
              class="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-slate-100"
              @click="menuOpen = !menuOpen"
            >
              <UiAvatar
                :first-name="user?.firstName"
                :last-name="user?.lastName"
                :avatar-url="user?.avatarUrl"
                size="sm"
              />
              <Icon name="lucide:chevron-down" class="size-4 text-slate-400" />
            </button>

            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              leave-active-class="transition duration-100 ease-in"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="menuOpen"
                class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop"
              >
                <div class="px-3 py-2">
                  <p class="truncate text-sm font-semibold text-ink">
                    {{ user?.firstName }} {{ user?.lastName }}
                  </p>
                  <p class="truncate text-xs text-slate-500">{{ user?.email }}</p>
                </div>
                <div class="my-1 h-px bg-slate-100" />
                <NuxtLink
                  to="/dashboard"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:layout-dashboard" class="size-4" /> Dashboard
                </NuxtLink>
                <NuxtLink
                  to="/dashboard/profile"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:user-round" class="size-4" /> Profilul meu
                </NuxtLink>
                <NuxtLink
                  to="/messages"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:message-square" class="size-4" /> Mesaje
                </NuxtLink>
                <NuxtLink
                  to="/dashboard/settings"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:settings" class="size-4" /> Setări
                </NuxtLink>
                <NuxtLink
                  v-if="user?.role === 'ADMIN'"
                  to="/admin"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  <Icon name="lucide:shield" class="size-4" /> Panou admin
                </NuxtLink>
                <NuxtLink
                  v-if="user?.role === 'CLIENT'"
                  to="/dashboard/jobs"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:briefcase" class="size-4" /> Joburile mele
                </NuxtLink>
                <NuxtLink
                  v-if="user?.role === 'FREELANCER'"
                  to="/dashboard/applications"
                  class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-slate-100"
                >
                  <Icon name="lucide:file-text" class="size-4" /> Aplicările mele
                </NuxtLink>
                <button
                  class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  @click="onLogout"
                >
                  <Icon name="lucide:log-out" class="size-4" /> Deconectare
                </button>
              </div>
            </Transition>
          </div>
        </template>

        <button
          class="flex size-9 items-center justify-center rounded-full text-ink hover:bg-slate-100 md:hidden"
          aria-label="Meniu"
          @click="mobileOpen = !mobileOpen"
        >
          <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-5" />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav
        v-if="mobileOpen"
        class="border-t border-slate-200 bg-white px-4 py-3 md:hidden"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-slate-100"
        >
          {{ item.label }}
        </NuxtLink>
        <div v-if="!isLoggedIn" class="mt-2 grid grid-cols-2 gap-2">
          <UiButton to="/login" variant="outline" size="sm" block>Autentificare</UiButton>
          <UiButton to="/register" size="sm" block>Înscrie-te</UiButton>
        </div>
      </nav>
    </Transition>
  </header>
</template>
