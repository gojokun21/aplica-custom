import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { conversations, messages } from '../db/schema';

const USER_COLS = { id: true, firstName: true, lastName: true, avatarUrl: true } as const;

@Injectable()
export class ChatService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Conversațiile utilizatorului (client sau freelancer) + ultimul mesaj. */
  async listConversations(userId: string) {
    const rows = await this.db.query.conversations.findMany({
      where: or(eq(conversations.clientId, userId), eq(conversations.freelancerId, userId)),
      orderBy: desc(conversations.createdAt),
      with: {
        job: { columns: { id: true, title: true } },
        client: { columns: USER_COLS },
        freelancer: { columns: USER_COLS },
      },
    });

    const ids = rows.map((r) => r.id);
    const lastByConv = new Map<string, { body: string; createdAt: Date; senderId: string }>();
    const unreadByConv = new Map<string, number>();
    if (ids.length) {
      const msgs = await this.db.query.messages.findMany({
        where: inArray(messages.conversationId, ids),
        orderBy: desc(messages.createdAt),
      });
      for (const m of msgs) {
        if (!lastByConv.has(m.conversationId)) {
          lastByConv.set(m.conversationId, {
            body: m.body,
            createdAt: m.createdAt,
            senderId: m.senderId,
          });
        }
        if (m.senderId !== userId && m.readAt === null) {
          unreadByConv.set(m.conversationId, (unreadByConv.get(m.conversationId) ?? 0) + 1);
        }
      }
    }

    return rows.map((r) => ({
      ...r,
      otherParty: r.clientId === userId ? r.freelancer : r.client,
      lastMessage: lastByConv.get(r.id) ?? null,
      unreadCount: unreadByConv.get(r.id) ?? 0,
    }));
  }

  /** Numărul total de mesaje necitite ale utilizatorului. */
  async unreadTotal(userId: string) {
    const myConvs = await this.db.query.conversations.findMany({
      where: or(eq(conversations.clientId, userId), eq(conversations.freelancerId, userId)),
      columns: { id: true },
    });
    const ids = myConvs.map((c) => c.id);
    if (ids.length === 0) return { total: 0 };
    const res = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, ids),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      );
    return { total: res[0]?.count ?? 0 };
  }

  /** Marchează citite mesajele primite dintr-o conversație. */
  async markRead(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    await this.db
      .update(messages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId),
          isNull(messages.readAt),
        ),
      );
    return { success: true };
  }

  /** Celălalt participant din conversație (destinatarul unui mesaj). */
  async otherParticipant(conversationId: string, senderId: string): Promise<string | null> {
    const conv = await this.db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });
    if (!conv) return null;
    return conv.clientId === senderId ? conv.freelancerId : conv.clientId;
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.assertParticipant(conversationId, userId);
    const full = await this.db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
      with: {
        job: { columns: { id: true, title: true, status: true } },
        client: { columns: USER_COLS },
        freelancer: { columns: USER_COLS },
      },
    });
    return {
      ...full!,
      otherParty: conversation.clientId === userId ? full!.freelancer : full!.client,
    };
  }

  async listMessages(userId: string, conversationId: string) {
    await this.assertParticipant(conversationId, userId);
    return this.db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: asc(messages.createdAt),
      with: { sender: { columns: USER_COLS } },
    });
  }

  async createMessage(userId: string, conversationId: string, body: string) {
    await this.assertParticipant(conversationId, userId);
    const trimmed = body?.trim();
    if (!trimmed) {
      throw new ForbiddenException('Mesaj gol');
    }
    const [inserted] = await this.db
      .insert(messages)
      .values({ conversationId, senderId: userId, body: trimmed.slice(0, 5000) })
      .returning();

    return this.db.query.messages.findFirst({
      where: eq(messages.id, inserted.id),
      with: { sender: { columns: USER_COLS } },
    });
  }

  /** Confirmă că userul face parte din conversație. */
  async assertParticipant(conversationId: string, userId: string) {
    const conversation = await this.db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(eq(conversations.clientId, userId), eq(conversations.freelancerId, userId)),
      ),
    });
    if (!conversation) {
      throw new NotFoundException('Conversație inexistentă sau acces interzis');
    }
    return conversation;
  }
}
