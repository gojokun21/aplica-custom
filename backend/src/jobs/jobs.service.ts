import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { applications, conversations, jobs, jobSkills, skills, users } from '../db/schema';
import { sanitizeRichText } from '../common/sanitize-html.util';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateJobDto } from './dto/create-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { UpdateJobDto } from './dto/update-job.dto';

function definedOnly<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

@Injectable()
export class JobsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateJobDto) {
    if (dto.budgetType === 'HOURLY' && dto.minRateCents != null && dto.maxRateCents != null) {
      if (dto.minRateCents > dto.maxRateCents) {
        throw new BadRequestException('Tariful minim nu poate depăși tariful maxim');
      }
    }

    const skillIds = [...new Set(dto.skillIds ?? [])];
    if (skillIds.length > 0) {
      const found = await this.db.query.skills.findMany({ where: inArray(skills.id, skillIds) });
      if (found.length !== skillIds.length) {
        throw new BadRequestException('Unele skill-uri nu există');
      }
    }

    const jobId = await this.db.transaction(async (tx) => {
      const [job] = await tx
        .insert(jobs)
        .values({
          clientId,
          title: dto.title,
          description: sanitizeRichText(dto.description),
          budgetType: dto.budgetType,
          budgetCents: dto.budgetType === 'FIXED' ? dto.budgetCents : null,
          minRateCents: dto.budgetType === 'HOURLY' ? dto.minRateCents : null,
          maxRateCents: dto.budgetType === 'HOURLY' ? dto.maxRateCents : null,
        })
        .returning();
      if (skillIds.length > 0) {
        await tx.insert(jobSkills).values(skillIds.map((skillId) => ({ jobId: job.id, skillId })));
      }
      return job.id;
    });

    return this.getById(jobId);
  }

  async list(query: QueryJobsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const offset = (page - 1) * limit;

    let jobIdsForSkill: string[] | undefined;
    if (query.skill) {
      const skill = await this.db.query.skills.findFirst({ where: eq(skills.slug, query.skill) });
      if (!skill) return { items: [], total: 0, page, limit, totalPages: 0 };
      const links = await this.db.query.jobSkills.findMany({
        where: eq(jobSkills.skillId, skill.id),
      });
      jobIdsForSkill = links.map((l) => l.jobId);
      if (jobIdsForSkill.length === 0) return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const conditions = [];
    if (jobIdsForSkill) conditions.push(inArray(jobs.id, jobIdsForSkill));
    if (query.status) conditions.push(eq(jobs.status, query.status));
    if (query.q) {
      const term = `%${query.q}%`;
      conditions.push(or(ilike(jobs.title, term), ilike(jobs.description, term)));
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await this.db
      .select({
        id: jobs.id,
        clientId: jobs.clientId,
        title: jobs.title,
        description: jobs.description,
        budgetType: jobs.budgetType,
        budgetCents: jobs.budgetCents,
        minRateCents: jobs.minRateCents,
        maxRateCents: jobs.maxRateCents,
        status: jobs.status,
        deliveredAt: jobs.deliveredAt,
        completedAt: jobs.completedAt,
        createdAt: jobs.createdAt,
        clientFirstName: users.firstName,
        clientLastName: users.lastName,
      })
      .from(jobs)
      .innerJoin(users, eq(users.id, jobs.clientId))
      .where(where)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset);

    const totalRes = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(jobs)
      .where(where);
    const total = totalRes[0]?.count ?? 0;

    const ids = rows.map((r) => r.id);
    const skillsByJob = await this.skillsByJob(ids);
    const countsByJob = await this.applicationCounts(ids);

    const items = rows.map(({ clientFirstName, clientLastName, ...rest }) => ({
      ...rest,
      client: { id: rest.clientId, firstName: clientFirstName, lastName: clientLastName },
      skills: skillsByJob.get(rest.id) ?? [],
      applicationsCount: countsByJob.get(rest.id) ?? 0,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const job = await this.db.query.jobs.findFirst({
      where: eq(jobs.id, id),
      with: {
        client: { columns: { id: true, firstName: true, lastName: true } },
        skills: { with: { skill: true } },
      },
    });
    if (!job) throw new NotFoundException('Anunț inexistent');
    const counts = await this.applicationCounts([id]);
    // Participantul angajat + conversația (dacă un freelancer a fost acceptat).
    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.jobId, id),
    });
    const { skills: skillLinks, ...rest } = job;
    return {
      ...rest,
      skills: skillLinks.map((l) => l.skill),
      applicationsCount: counts.get(id) ?? 0,
      acceptedFreelancerId: conversation?.freelancerId ?? null,
      conversationId: conversation?.id ?? null,
    };
  }

  /** Freelancerul angajat marchează livrarea. */
  async markDelivered(freelancerId: string, jobId: string) {
    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.jobId, jobId),
    });
    if (!conversation || conversation.freelancerId !== freelancerId) {
      throw new ForbiddenException('Doar freelancerul angajat poate marca livrarea');
    }
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Jobul nu este în lucru');
    }
    if (job.deliveredAt) {
      throw new BadRequestException('Livrarea a fost deja marcată');
    }
    await this.db
      .update(jobs)
      .set({ deliveredAt: new Date(), updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    await this.notifications.create(job.clientId, {
      type: 'DELIVERED',
      title: 'Lucrare livrată',
      body: `„${job.title}" a fost livrat — confirmă finalizarea`,
      link: `/jobs/${jobId}`,
    });
    return this.getById(jobId);
  }

  /** Clientul confirmă finalizarea (după ce freelancerul a marcat livrarea). */
  async complete(clientId: string, jobId: string) {
    const job = await this.assertOwner(jobId, clientId);
    if (job.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Jobul nu este în lucru');
    }
    if (!job.deliveredAt) {
      throw new BadRequestException('Freelancerul nu a marcat încă livrarea');
    }
    await this.db
      .update(jobs)
      .set({ status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(jobs.id, jobId));

    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.jobId, jobId),
    });
    if (conversation) {
      await this.notifications.create(conversation.freelancerId, {
        type: 'COMPLETED',
        title: 'Job finalizat',
        body: `„${job.title}" a fost finalizat. Poți lăsa o recenzie.`,
        link: `/jobs/${jobId}`,
      });
    }
    return this.getById(jobId);
  }

  async listMine(clientId: string) {
    const rows = await this.db.query.jobs.findMany({
      where: eq(jobs.clientId, clientId),
      orderBy: desc(jobs.createdAt),
      with: { skills: { with: { skill: true } } },
    });
    const counts = await this.applicationCounts(rows.map((r) => r.id));
    return rows.map(({ skills: skillLinks, ...rest }) => ({
      ...rest,
      skills: skillLinks.map((l) => l.skill),
      applicationsCount: counts.get(rest.id) ?? 0,
    }));
  }

  async update(clientId: string, id: string, dto: UpdateJobDto) {
    await this.assertOwner(id, clientId);
    const patch = definedOnly(dto);
    if (typeof patch.description === 'string') {
      patch.description = sanitizeRichText(patch.description);
    }
    const [updated] = await this.db
      .update(jobs)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Anunț inexistent');
    return this.getById(id);
  }

  async remove(clientId: string, id: string) {
    await this.assertOwner(id, clientId);
    await this.db.delete(jobs).where(eq(jobs.id, id));
    return { success: true };
  }

  /* -------------------------------- Helpers -------------------------------- */

  private async assertOwner(jobId: string, clientId: string) {
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    if (job.clientId !== clientId) {
      throw new ForbiddenException('Nu ești proprietarul acestui anunț');
    }
    return job;
  }

  private async skillsByJob(ids: string[]) {
    const map = new Map<string, { id: string; name: string; slug: string }[]>();
    if (ids.length === 0) return map;
    const rows = await this.db
      .select({
        jobId: jobSkills.jobId,
        id: skills.id,
        name: skills.name,
        slug: skills.slug,
      })
      .from(jobSkills)
      .innerJoin(skills, eq(skills.id, jobSkills.skillId))
      .where(inArray(jobSkills.jobId, ids));
    for (const r of rows) {
      const list = map.get(r.jobId) ?? [];
      list.push({ id: r.id, name: r.name, slug: r.slug });
      map.set(r.jobId, list);
    }
    return map;
  }

  private async applicationCounts(ids: string[]) {
    const map = new Map<string, number>();
    if (ids.length === 0) return map;
    const rows = await this.db
      .select({ jobId: applications.jobId, count: sql<number>`count(*)::int` })
      .from(applications)
      .where(inArray(applications.jobId, ids))
      .groupBy(applications.jobId);
    for (const r of rows) map.set(r.jobId, r.count);
    return map;
  }
}
