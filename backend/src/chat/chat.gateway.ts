import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

const room = (conversationId: string) => `conv:${conversationId}`;

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly chat: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined);
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token ?? '', {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      client.data.userId = payload.sub;
      // Canal per-utilizator pentru notificări + badge de mesaje necitite.
      await client.join('user:' + payload.sub);
    } catch {
      client.emit('error', 'Autentificare eșuată');
      client.disconnect(true);
    }
  }

  /** Emite un eveniment către toate socket-urile unui utilizator. */
  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to('user:' + userId).emit(event, payload);
  }

  @SubscribeMessage('conversation:join')
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId as string;
    try {
      await this.chat.assertParticipant(data.conversationId, userId);
      await client.join(room(data.conversationId));
      return { ok: true };
    } catch {
      return { ok: false, error: 'Acces interzis' };
    }
  }

  @SubscribeMessage('conversation:leave')
  async leave(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    await client.leave(room(data.conversationId));
    return { ok: true };
  }

  @SubscribeMessage('message:send')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; body: string },
  ) {
    const userId = client.data.userId as string;
    try {
      const message = await this.chat.createMessage(userId, data.conversationId, data.body);
      await this.emitMessage(data.conversationId, message);
      return { ok: true, message };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  }

  @SubscribeMessage('typing')
  typing(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.to(room(data.conversationId)).emit('typing', { userId: client.data.userId as string });
  }

  /**
   * Emite un mesaj nou în camera conversației și un semnal de „necitit" în
   * canalul personal al destinatarului (pentru badge-ul din header).
   */
  async emitMessage(conversationId: string, message: { senderId: string } | unknown) {
    this.server?.to(room(conversationId)).emit('message:new', message);
    const senderId = (message as { senderId?: string })?.senderId;
    if (senderId) {
      const recipientId = await this.chat.otherParticipant(conversationId, senderId);
      if (recipientId) {
        this.emitToUser(recipientId, 'message:unread', { conversationId });
      }
    }
  }
}
