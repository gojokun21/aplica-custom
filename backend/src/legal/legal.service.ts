import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { sanitizeArticle } from '../common/sanitize-html.util';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { legalPages } from '../db/schema';
import { UpdateLegalDto } from './dto/update-legal.dto';

const PLACEHOLDER = '<p>Conținut de completat din panoul de admin.</p>';
const DEFAULTS = [
  { slug: 'terms', title: 'Termeni și condiții', content: PLACEHOLDER },
  { slug: 'privacy', title: 'Politica de confidențialitate', content: PLACEHOLDER },
];

@Injectable()
export class LegalService implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async onModuleInit() {
    await this.db.insert(legalPages).values(DEFAULTS).onConflictDoNothing();
  }

  list() {
    return this.db.query.legalPages.findMany({ orderBy: asc(legalPages.slug) });
  }

  async getBySlug(slug: string) {
    const page = await this.db.query.legalPages.findFirst({ where: eq(legalPages.slug, slug) });
    if (!page) throw new NotFoundException('Pagină inexistentă');
    return page;
  }

  async update(slug: string, dto: UpdateLegalDto) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.title != null) patch.title = dto.title;
    if (dto.content != null) patch.content = sanitizeArticle(dto.content);
    const [updated] = await this.db
      .update(legalPages)
      .set(patch)
      .where(eq(legalPages.slug, slug))
      .returning();
    if (!updated) throw new NotFoundException('Pagină inexistentă');
    return updated;
  }
}
