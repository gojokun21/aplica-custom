import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { sanitizeRichText } from '../common/sanitize-html.util';
import { NotificationsService } from '../notifications/notifications.service';
import { conversations, jobs, reviews } from '../db/schema';
import { CreateReviewDto } from './dto/create-review.dto';

export interface RatingSummary {
  avg: number;
  count: number;
}

const REVIEWER_COLS = { id: true, firstName: true, lastName: true } as const;

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  async create(reviewerId: string, jobId: string, dto: CreateReviewDto) {
    const job = await this.db.query.jobs.findFirst({ where: eq(jobs.id, jobId) });
    if (!job) throw new NotFoundException('Anunț inexistent');
    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Poți lăsa o recenzie doar după finalizarea jobului');
    }

    const conversation = await this.db.query.conversations.findFirst({
      where: eq(conversations.jobId, jobId),
    });
    if (!conversation) {
      throw new BadRequestException('Jobul nu are o colaborare asociată');
    }
    const { clientId, freelancerId } = conversation;
    if (reviewerId !== clientId && reviewerId !== freelancerId) {
      throw new ForbiddenException('Doar participanții la colaborare pot lăsa recenzii');
    }
    const revieweeId = reviewerId === clientId ? freelancerId : clientId;

    const existing = await this.db.query.reviews.findFirst({
      where: and(eq(reviews.jobId, jobId), eq(reviews.reviewerId, reviewerId)),
    });
    if (existing) {
      throw new ConflictException('Ai lăsat deja o recenzie pentru acest job');
    }

    const [review] = await this.db
      .insert(reviews)
      .values({
        jobId,
        reviewerId,
        revieweeId,
        rating: dto.rating,
        comment: dto.comment ? sanitizeRichText(dto.comment) : dto.comment,
      })
      .returning();

    await this.notifications.create(revieweeId, {
      type: 'REVIEW',
      title: 'Ai primit o recenzie',
      body: `Ai primit o recenzie de ${dto.rating}★ pentru „${job.title}"`,
      link: `/jobs/${jobId}`,
    });
    return review;
  }

  listForJob(jobId: string) {
    return this.db.query.reviews.findMany({
      where: eq(reviews.jobId, jobId),
      orderBy: desc(reviews.createdAt),
      with: { reviewer: { columns: REVIEWER_COLS } },
    });
  }

  async listForUser(userId: string) {
    const items = await this.db.query.reviews.findMany({
      where: eq(reviews.revieweeId, userId),
      orderBy: desc(reviews.createdAt),
      with: { reviewer: { columns: REVIEWER_COLS } },
    });
    const summary = (await this.ratingSummary([userId])).get(userId) ?? { avg: 0, count: 0 };
    return { items, summary };
  }

  /** Rating agregat per utilizator (medie rotunjită la 1 zecimală + număr). */
  async ratingSummary(userIds: string[]): Promise<Map<string, RatingSummary>> {
    const map = new Map<string, RatingSummary>();
    if (userIds.length === 0) return map;
    const rows = await this.db
      .select({
        userId: reviews.revieweeId,
        count: sql<number>`count(*)::int`,
        avg: sql<number>`avg(rating)::float`,
      })
      .from(reviews)
      .where(inArray(reviews.revieweeId, userIds))
      .groupBy(reviews.revieweeId);
    for (const r of rows) {
      map.set(r.userId, { avg: Math.round(r.avg * 10) / 10, count: r.count });
    }
    return map;
  }
}
