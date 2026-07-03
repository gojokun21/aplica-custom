import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import {
  applications,
  conversations,
  jobs,
  refreshTokens,
  reviews,
  users,
} from '../db/schema';
import { AdminQueryDto } from './dto/admin-query.dto';

const USER_COLS = { id: true, firstName: true, lastName: true, avatarUrl: true } as const;

@Injectable()
export class AdminService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async stats() {
    const usersByRole = await this.db
      .select({ role: users.role, count: sql<number>`count(*)::int` })
      .from(users)
      .groupBy(users.role);
    const blocked = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(sql`${users.blockedAt} is not null`);
    const jobsByStatus = await this.db
      .select({ status: jobs.status, count: sql<number>`count(*)::int` })
      .from(jobs)
      .groupBy(jobs.status);
    const one = async (table: typeof applications | typeof reviews | typeof conversations) =>
      (await this.db.select({ count: sql<number>`count(*)::int` }).from(table))[0]?.count ?? 0;

    const roleCount = (r: string) => usersByRole.find((u) => u.role === r)?.count ?? 0;
    const statusCount = (s: string) => jobsByStatus.find((j) => j.status === s)?.count ?? 0;

    return {
      users: {
        total: usersByRole.reduce((a, u) => a + u.count, 0),
        clients: roleCount('CLIENT'),
        freelancers: roleCount('FREELANCER'),
        admins: roleCount('ADMIN'),
        blocked: blocked[0]?.count ?? 0,
      },
      jobs: {
        total: jobsByStatus.reduce((a, j) => a + j.count, 0),
        open: statusCount('OPEN'),
        inProgress: statusCount('IN_PROGRESS'),
        completed: statusCount('COMPLETED'),
        cancelled: statusCount('CANCELLED'),
      },
      applications: await one(applications),
      reviews: await one(reviews),
      conversations: await one(conversations),
    };
  }

  /* --------------------------------- Users --------------------------------- */

  async listUsers(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.q
      ? or(
          ilike(users.email, `%${query.q}%`),
          ilike(users.firstName, `%${query.q}%`),
          ilike(users.lastName, `%${query.q}%`),
        )
      : undefined;

    const items = await this.db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        avatarUrl: users.avatarUrl,
        blockedAt: users.blockedAt,
        emailVerifiedAt: users.emailVerifiedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const total = (await this.db.select({ count: sql<number>`count(*)::int` }).from(users).where(where))[0]?.count ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUserRole(adminId: string, userId: string, role: 'CLIENT' | 'FREELANCER' | 'ADMIN') {
    if (userId === adminId) {
      throw new ForbiddenException('Nu îți poți schimba propriul rol');
    }
    const [updated] = await this.db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new NotFoundException('Utilizator inexistent');
    return this.sanitize(updated);
  }

  async setBlocked(adminId: string, userId: string, blocked: boolean) {
    if (userId === adminId) {
      throw new ForbiddenException('Nu îți poți bloca propriul cont');
    }
    const [updated] = await this.db
      .update(users)
      .set({ blockedAt: blocked ? new Date() : null, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new NotFoundException('Utilizator inexistent');
    if (blocked) {
      // Revocă toate sesiunile userului blocat.
      await this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
    }
    return this.sanitize(updated);
  }

  async deleteUser(adminId: string, userId: string) {
    if (userId === adminId) {
      throw new ForbiddenException('Folosește Setări cont pentru a-ți șterge propriul cont');
    }
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!user) throw new NotFoundException('Utilizator inexistent');
    this.deleteAvatarFile(user.avatarUrl);
    await this.db.delete(users).where(eq(users.id, userId));
    return { success: true };
  }

  /* --------------------------------- Jobs ---------------------------------- */

  async listJobs(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.q ? ilike(jobs.title, `%${query.q}%`) : undefined;

    const rows = await this.db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        budgetType: jobs.budgetType,
        createdAt: jobs.createdAt,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(jobs)
      .innerJoin(users, eq(users.id, jobs.clientId))
      .where(where)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const ids = rows.map((r) => r.id);
    const counts = new Map<string, number>();
    if (ids.length) {
      const c = await this.db
        .select({ jobId: applications.jobId, count: sql<number>`count(*)::int` })
        .from(applications)
        .where(inArray(applications.jobId, ids))
        .groupBy(applications.jobId);
      for (const r of c) counts.set(r.jobId, r.count);
    }
    const items = rows.map(({ clientFirstName, clientLastName, ...rest }) => ({
      ...rest,
      client: { firstName: clientFirstName, lastName: clientLastName },
      applicationsCount: counts.get(rest.id) ?? 0,
    }));

    const total = (await this.db.select({ count: sql<number>`count(*)::int` }).from(jobs).where(where))[0]?.count ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteJob(jobId: string) {
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    await this.db.delete(jobs).where(eq(jobs.id, jobId));
    return { success: true };
  }

  /* -------------------------------- Reviews -------------------------------- */

  async listReviews(query: AdminQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const items = await this.db.query.reviews.findMany({
      orderBy: desc(reviews.createdAt),
      limit,
      offset: (page - 1) * limit,
      with: {
        reviewer: { columns: USER_COLS },
        reviewee: { columns: USER_COLS },
        job: { columns: { id: true, title: true } },
      },
    });
    const total = (await this.db.select({ count: sql<number>`count(*)::int` }).from(reviews))[0]?.count ?? 0;
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteReview(reviewId: string) {
    const review = await this.db.query.reviews.findFirst({ where: eq(reviews.id, reviewId) });
    if (!review) throw new NotFoundException('Recenzie inexistentă');
    await this.db.delete(reviews).where(eq(reviews.id, reviewId));
    return { success: true };
  }

  /* -------------------------------- Helpers -------------------------------- */

  private deleteAvatarFile(url?: string | null) {
    if (!url || !url.startsWith('/uploads/')) return;
    try {
      const path = join(process.cwd(), url.replace(/^\//, ''));
      if (existsSync(path)) unlinkSync(path);
    } catch {
      /* best-effort */
    }
  }

  private sanitize<T extends { passwordHash?: string }>(user: T) {
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }
}
