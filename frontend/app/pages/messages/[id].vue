<script setup lang="ts">
import type { ChatMessage } from '~/composables/useSocket';

definePageMeta({ middleware: 'auth' });

interface ConversationHead {
  id: string;
  job: { id: string; title: string; status: string };
  otherParty: { id: string; firstName: string; lastName: string; avatarUrl: string | null };
}

const route = useRoute();
const { $api } = useNuxtApp();
const { user } = useAuth();
const { joinConversation, leaveConversation, sendMessage, onMessage } = useSocket();
const { activeConversationId, refreshMsgUnread } = useNotifications();

const convId = route.params.id as string;

const { data: head, error } = await useAsyncData(`conv-head-${convId}`, () =>
  $api<ConversationHead>(`/conversations/${convId}`),
);
const { data: history } = await useAsyncData(`conv-msgs-${convId}`, () =>
  $api<ChatMessage[]>(`/conversations/${convId}/messages`).catch(() => [] as ChatMessage[]),
);

const messages = ref<ChatMessage[]>([]);
watchEffect(() => { if (history.value) messages.value = [...history.value]; });

const draft = ref('');
const listEl = ref<HTMLElement | null>(null);

async function scrollToBottom() {
  await nextTick();
  if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight;
}

function send() {
  const body = draft.value.trim();
  if (!body) return;
  sendMessage(convId, body); // serverul persistă + emite înapoi 'message:new'
  draft.value = '';
}

let unsub: (() => void) | undefined;
onMounted(async () => {
  activeConversationId.value = convId;
  joinConversation(convId);
  unsub = onMessage((msg) => {
    if (msg.conversationId === convId) {
      messages.value.push(msg);
      scrollToBottom();
      // Mesajul primit aici e citit imediat (conversație deschisă).
      if (msg.senderId !== user.value?.id) markReadNow();
    }
  });
  // Marchează citite mesajele existente + actualizează badge-ul.
  await markReadNow();
  await scrollToBottom();
});
onBeforeUnmount(() => {
  unsub?.();
  leaveConversation(convId);
  activeConversationId.value = null;
});

async function markReadNow() {
  await $api(`/conversations/${convId}/read`, { method: 'POST' }).catch(() => {});
  await refreshMsgUnread();
}

function initials(m: ChatMessage) {
  return (m.sender.firstName[0] ?? '') + (m.sender.lastName[0] ?? '');
}
function time(iso: string) {
  return new Date(iso).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <div class="container-page max-w-3xl py-6">
    <NuxtLink to="/messages" class="flex items-center gap-1.5 text-sm text-body hover:text-brand-600">
      <Icon name="lucide:arrow-left" class="size-4" /> Toate conversațiile
    </NuxtLink>

    <div v-if="error" class="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
      <Icon name="lucide:message-square-off" class="mx-auto size-10 text-slate-300" />
      <p class="mt-3 font-medium text-ink">Conversație inexistentă</p>
      <UiButton to="/messages" variant="outline" class="mt-6">Înapoi la mesaje</UiButton>
    </div>

    <div v-else-if="head" class="mt-4 flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <!-- Header -->
      <div class="flex items-center gap-3 border-b border-slate-100 p-4">
        <UiAvatar
          :first-name="head.otherParty.firstName"
          :last-name="head.otherParty.lastName"
          :avatar-url="head.otherParty.avatarUrl"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-ink">{{ head.otherParty.firstName }} {{ head.otherParty.lastName }}</p>
          <NuxtLinkLocale :to="`/proiecte/${head.job.id}`" class="truncate text-xs text-body hover:text-brand-600">{{ head.job.title }}</NuxtLinkLocale>
        </div>
        <UiButton :to="`/proiecte/${head.job.id}`" variant="outline" size="sm" class="shrink-0">
          <Icon name="lucide:briefcase" class="size-4" /> Vezi jobul
        </UiButton>
      </div>

      <!-- Messages -->
      <div ref="listEl" class="flex-1 space-y-3 overflow-y-auto p-4">
        <p v-if="messages.length === 0" class="py-8 text-center text-sm text-body">
          Începeți conversația 👋
        </p>
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex items-end gap-2"
          :class="m.senderId === user?.id ? 'flex-row-reverse' : ''"
        >
          <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold uppercase text-slate-600">{{ initials(m) }}</span>
          <div
            class="max-w-[75%] rounded-2xl px-3.5 py-2 text-sm"
            :class="m.senderId === user?.id
              ? 'rounded-br-sm bg-brand-600 text-white'
              : 'rounded-bl-sm bg-slate-100 text-ink'"
          >
            <p class="whitespace-pre-wrap break-words">{{ m.body }}</p>
            <p class="mt-0.5 text-right text-[10px] opacity-70">{{ time(m.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Composer -->
      <form class="flex items-center gap-2 border-t border-slate-100 p-3" @submit.prevent="send">
        <input
          v-model="draft"
          type="text"
          placeholder="Scrie un mesaj…"
          class="h-11 flex-1 rounded-full border border-slate-300 bg-white px-4 text-sm text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none"
        />
        <UiButton type="submit" size="md" class="shrink-0 !px-4" :disabled="!draft.trim()">
          <Icon name="lucide:send-horizontal" class="size-4" />
        </UiButton>
      </form>
    </div>
  </div>
</template>
