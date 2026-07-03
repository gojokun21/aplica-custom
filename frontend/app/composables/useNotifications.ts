export interface AppNotification {
  id: string;
  type: 'MESSAGE' | 'HIRED' | 'REVIEW' | 'APPLICATION' | 'DELIVERED' | 'COMPLETED';
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export function useNotifications() {
  const { $api } = useNuxtApp();
  const { onNotification, onMessageUnread } = useSocket();

  const items = useState<AppNotification[]>('notifications', () => []);
  const notifUnread = useState<number>('notif-unread', () => 0);
  const msgUnread = useState<number>('msg-unread', () => 0);
  const activeConversationId = useState<string | null>('active-conversation', () => null);
  const initialized = useState<boolean>('notif-initialized', () => false);

  async function init() {
    if (initialized.value) return;
    initialized.value = true;

    const [list, nCount, mTotal] = await Promise.all([
      $api<AppNotification[]>('/notifications').catch(() => []),
      $api<{ count: number }>('/notifications/unread-count').catch(() => ({ count: 0 })),
      $api<{ total: number }>('/conversations/unread-total').catch(() => ({ total: 0 })),
    ]);
    items.value = list;
    notifUnread.value = nCount.count;
    msgUnread.value = mTotal.total;

    if (import.meta.client) {
      onNotification((n) => {
        items.value = [n as AppNotification, ...items.value].slice(0, 30);
        notifUnread.value += 1;
      });
      onMessageUnread(({ conversationId }) => {
        if (conversationId !== activeConversationId.value) {
          msgUnread.value += 1;
        }
      });
    }
  }

  async function markRead(id: string) {
    const n = items.value.find((x) => x.id === id);
    if (n && !n.readAt) {
      n.readAt = new Date().toISOString();
      notifUnread.value = Math.max(0, notifUnread.value - 1);
      await $api(`/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    }
  }

  async function markAllRead() {
    items.value = items.value.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }));
    notifUnread.value = 0;
    await $api('/notifications/read-all', { method: 'POST' }).catch(() => {});
  }

  async function refreshMsgUnread() {
    const res = await $api<{ total: number }>('/conversations/unread-total').catch(() => ({ total: 0 }));
    msgUnread.value = res.total;
  }

  function reset() {
    items.value = [];
    notifUnread.value = 0;
    msgUnread.value = 0;
    initialized.value = false;
  }

  return {
    items,
    notifUnread,
    msgUnread,
    activeConversationId,
    init,
    markRead,
    markAllRead,
    refreshMsgUnread,
    reset,
  };
}
