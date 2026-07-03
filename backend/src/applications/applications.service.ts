import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, ne } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { sanitizeRichText } from '../common/sanitize-html.util';
import { NotificationsService } from '../notifications/notifications.service';
import { applications, conversations, freelancerProfiles, jobs } from '../db/schema';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(freelancerId: string, jobId: string, dto: CreateApplicationDto) {
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    if (job.clientId === freelancerId) {
      throw new ForbiddenException('Nu poți aplica la propriul anunț');
    }
    if (job.status !== 'OPEN') {
      throw new BadRequestException('Anunțul nu mai primește aplicări');
    }

    const existing = await this.db.query.applications.findFirst({
      where: and(eq(applications.jobId, jobId), eq(applications.freelancerId, freelancerId)),
    });
    if (existing) {
      throw new ConflictException('Ai aplicat deja la acest anunț');
    }

    const [application] = await this.db
      .insert(applications)
      .values({
        jobId,
        freelancerId,
        coverLetter: dto.coverLetter ? sanitizeRichText(dto.coverLetter) : dto.coverLetter,
        proposedRateCents: dto.proposedRateCents,
      })
      .returning();

    await this.notifications.create(job.clientId, {
      type: 'APPLICATION',
      title: 'Aplicant nou',
      body: `Cineva a aplicat la „${job.title}"`,
      link: `/jobs/${jobId}/applicants`,
    });
    return application;
  }

  /** Aplicanții unui anunț — doar pentru clientul proprietar. */
  async listForJob(clientId: string, jobId: string) {
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    if (job.clientId !== clientId) {
      throw new ForbiddenException('Nu ești proprietarul acestui anunț');
    }

    const rows = await this.db.query.applications.findMany({
      where: eq(applications.jobId, jobId),
      orderBy: desc(applications.createdAt),
      with: { freelancer: { columns: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    // Titlu profil + tarif, într-un singur query.
    const freelancerIds = rows.map((r) => r.freelancerId);
    const profiles = freelancerIds.length
      ? await this.db.query.freelancerProfiles.findMany({
          where: inArray(freelancerProfiles.userId, freelancerIds),
        })
      : [];
    const profileByUser = new Map(profiles.map((p) => [p.userId, p]));

    return rows.map((r) => ({
      ...r,
      freelancerProfile: profileByUser.get(r.freelancerId)
        ? {
            title: profileByUser.get(r.freelancerId)!.title,
            hourlyRateCents: profileByUser.get(r.freelancerId)!.hourlyRateCents,
          }
        : null,
    }));
  }

  /** Aplicările freelancerului curent. */
  listMine(freelancerId: string) {
    return this.db.query.applications.findMany({
      where: eq(applications.freelancerId, freelancerId),
      orderBy: desc(applications.createdAt),
      with: {
        job: {
          columns: { id: true, title: true, status: true, budgetType: true, budgetCents: true },
          with: { client: { columns: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
  }

  /**
   * Clientul acceptă un aplicant: aplicarea devine ACCEPTED, restul REJECTED,
   * jobul trece în IN_PROGRESS și se creează conversația. Idempotent-safe prin
   * verificarea stării în tranzacție.
   */
  async accept(clientId: string, applicationId: string) {
    const application = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
      with: { job: true },
    });
    if (!application) throw new NotFoundException('Aplicare inexistentă');
    if (application.job.clientId !== clientId) {
      throw new ForbiddenException('Nu ești proprietarul acestui anunț');
    }
    if (application.job.status !== 'OPEN') {
      throw new BadRequestException('Anunțul are deja un freelancer selectat sau este închis');
    }
    if (application.status !== 'PENDING') {
      throw new BadRequestException('Aplicarea nu mai este în așteptare');
    }

    const conversation = await this.db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ status: 'ACCEPTED', updatedAt: new Date() })
        .where(eq(applications.id, applicationId));

      await tx
        .update(applications)
        .set({ status: 'REJECTED', updatedAt: new Date() })
        .where(and(eq(applications.jobId, application.jobId), ne(applications.id, applicationId)));

      await tx
        .update(jobs)
        .set({ status: 'IN_PROGRESS', acceptedApplicationId: applicationId, updatedAt: new Date() })
        .where(eq(jobs.id, application.jobId));

      const [conv] = await tx
        .insert(conversations)
        .values({
          jobId: application.jobId,
          clientId,
          freelancerId: application.freelancerId,
          applicationId,
        })
        .returning();

      return conv;
    });

    await this.notifications.create(application.freelancerId, {
      type: 'HIRED',
      title: 'Ai fost angajat!',
      body: `Ai fost selectat pentru „${application.job.title}"`,
      link: `/messages/${conversation.id}`,
    });
    return conversation;
  }

  async withdraw(freelancerId: string, applicationId: string) {
    const application = await this.db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });
    if (!application) throw new NotFoundException('Aplicare inexistentă');
    if (application.freelancerId !== freelancerId) {
      throw new ForbiddenException('Nu este aplicarea ta');
    }
    if (application.status !== 'PENDING') {
      throw new BadRequestException('Doar aplicările în așteptare pot fi retrase');
    }
    await this.db
      .update(applications)
      .set({ status: 'WITHDRAWN', updatedAt: new Date() })
      .where(eq(applications.id, applicationId));
    return { success: true };
  }
}
