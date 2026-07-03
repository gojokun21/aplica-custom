import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { ChatGateway } from '../chat/chat.gateway';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { MailService } from '../mail/mail.service';
import { notifications, NotificationType, users } from '../db/schema';

interface CreateNotification {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gateway: ChatGateway,
    private readonly mail: MailService,
  ) {}

  /** Creează o notificare, o trimite în timp real și pe email (best-effort). */
  async create(userId: string, payload: CreateNotification) {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link,
      })
      .returning();
    this.gateway.emitToUser(userId, 'notification:new', notification);
    // Email best-effort — nu blochează răspunsul API.
    void this.emailNotification(userId, notification);
    return notification;
  }

  private async emailNotification(userId: string, notification: typeof notifications.$inferSelect) {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { email: true },
      });
      if (user?.email) {
        await this.mail.sendNotificationEmail(
          user.email,
          notification.title,
          notification.body,
          notification.link,
        );
      }
    } catch {
      // ignorat — notificarea în app + real-time rămân valide
    }
  }

  list(userId: string) {
    return this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
      limit: 30,
    });
  }

  async unreadCount(userId: string) {
    const res = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { count: res[0]?.count ?? 0 };
  }

  async markRead(userId: string, id: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
    return { success: true };
  }
}
