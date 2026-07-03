<script setup lang="ts">
definePageMeta({ middleware: 'auth' });

interface Conversation {
  id: string;
  job: { id: string; title: string };
  otherParty: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

const { $api } = useNuxtApp();
const { data: conversations } = await useAsyncData('conversations', () =>
  $api<Conversation[]>('/conversations').catch(() => [] as Conversation[]),
);

function initials(c: Conversation) {
  return (c.otherParty.firstName[0] ?? '') + (c.otherParty.lastName[0] ?? '');
}
</script>

<template>
  <div class="container-page max-w-3xl py-10">
    <h1 class="text-2xl font-bold text-ink">Mesaje</h1>

    <div v-if="!conversations || conversations.length === 0" class="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:message-square" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Nicio conversație încă</p>
      <p class="mt-1 text-sm text-body">Conversațiile apar după ce un client acceptă un freelancer.</p>
    </div>

    <div v-else class="mt-6 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
      <NuxtLink
        v-for="c in conversations"
        :key="c.id"
        :to="`/messages/${c.id}`"
        class="flex items-center gap-4 bg-white p-4 transition-colors hover:bg-slate-50"
      >
        <UiAvatar :first-name="c.otherParty.firstName" :last-name="c.otherParty.lastName" :avatar-url="c.otherParty.avatarUrl" size="md" />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-ink">{{ c.otherParty.firstName }} {{ c.otherParty.lastName }}</p>
          <p class="truncate text-sm" :class="c.unreadCount > 0 ? 'font-medium text-ink' : 'text-body'">
            <span class="text-slate-400">{{ c.job.title }} · </span>{{ c.lastMessage?.body || 'Fără mesaje încă' }}
          </p>
        </div>
        <span
          v-if="c.unreadCount > 0"
          class="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white"
        >
          {{ c.unreadCount }}
        </span>
        <Icon v-else name="lucide:chevron-right" class="size-5 shrink-0 text-slate-300" />
      </NuxtLink>
    </div>
  </div>
</template>
