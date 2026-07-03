import { io, type Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string };
}

// Socket unic pe aplicație (client-side).
let socket: Socket | null = null;

export function useSocket() {
  const config = useRuntimeConfig();
  const accessToken = useCookie<string | null>('access_token');

  function connect(): Socket {
    const url = config.public.apiBase as string;
    if (!socket) {
      socket = io(url, {
        auth: { token: accessToken.value },
        transports: ['websocket'],
        autoConnect: true,
      });
    } else {
      // Reîmprospătează token-ul (poate s-a rotit) și reconectează la nevoie.
      socket.auth = { token: accessToken.value };
      if (!socket.connected) socket.connect();
    }
    return socket;
  }

  function joinConversation(conversationId: string) {
    connect().emit('conversation:join', { conversationId });
  }

  function leaveConversation(conversationId: string) {
    socket?.emit('conversation:leave', { conversationId });
  }

  function sendMessage(conversationId: string, body: string) {
    connect().emit('message:send', { conversationId, body });
  }

  /** Ascultă mesaje noi; returnează funcția de dezabonare. */
  function onMessage(cb: (msg: ChatMessage) => void) {
    const s = connect();
    s.on('message:new', cb);
    return () => s.off('message:new', cb);
  }

  /** Ascultă notificări noi (evenimente). */
  function onNotification(cb: (n: unknown) => void) {
    const s = connect();
    s.on('notification:new', cb);
    return () => s.off('notification:new', cb);
  }

  /** Ascultă semnale de mesaj necitit (pentru badge). */
  function onMessageUnread(cb: (data: { conversationId: string }) => void) {
    const s = connect();
    s.on('message:unread', cb);
    return () => s.off('message:unread', cb);
  }

  return {
    connect,
    joinConversation,
    leaveConversation,
    sendMessage,
    onMessage,
    onNotification,
    onMessageUnread,
  };
}

export type { ChatMessage };
