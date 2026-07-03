import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.constants';
import type { DrizzleDB } from '../db/drizzle.module';
import { seoPages } from '../db/schema';
import { UpdateSeoDto } from './dto/update-seo.dto';
import { UpsertSeoDto } from './dto/upsert-seo.dto';

const GLOBAL = '*';

const DEFAULT_ROWS = [
  {
    path: GLOBAL,
    title: 'aplica — Angajează talente. Găsește proiecte.',
    description:
      'aplica conectează clienți cu freelanceri de top. Postează un proiect sau găsește-ți următorul job în minute.',
    keywords: 'freelancing, joburi, freelanceri, proiecte, aplica',
    titleTemplate: '%s · aplica',
  },
  { path: '/', title: 'aplica — Angajează talente. Găsește proiecte.' },
  { path: '/talent', title: 'Găsește talente', description: 'Freelanceri verificați, gata de colaborare.' },
  { path: '/jobs', title: 'Găsește proiecte', description: 'Anunțuri de la clienți, gata de aplicat.' },
];

@Injectable()
export class SeoService implements OnModuleInit {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /** Seed idempotent al rândurilor implicite la pornire. */
  async onModuleInit() {
    await this.db.insert(seoPages).values(DEFAULT_ROWS).onConflictDoNothing();
  }

  /** Config SEO efectiv pentru o rută: global ('*') suprascris de path exact. */
  async resolve(path: string) {
    const global = await this.db.query.seoPages.findFirst({ where: eq(seoPages.path, GLOBAL) });
    const page =
      path && path !== GLOBAL
        ? await this.db.query.seoPages.findFirst({ where: eq(seoPages.path, path) })
        : null;

    const pick = <T>(a: T | null | undefined, b: T | null | undefined) =>
      a != null && a !== '' ? a : (b ?? null);

    return {
      path,
      title: pick(page?.title, global?.title),
      description: pick(page?.description, global?.description),
      keywords: pick(page?.keywords, global?.keywords),
      ogImageUrl: pick(page?.ogImageUrl, global?.ogImageUrl),
      titleTemplate: global?.titleTemplate ?? null,
      noindex: page?.noindex ?? false,
    };
  }

  /* -------------------------------- Admin ---------------------------------- */

  list() {
    return this.db.query.seoPages.findMany({ orderBy: asc(seoPages.path) });
  }

  async create(dto: UpsertSeoDto) {
    const [row] = await this.db
      .insert(seoPages)
      .values({ ...dto, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: seoPages.path,
        set: { ...dto, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  async update(id: string, dto: UpdateSeoDto) {
    const [row] = await this.db
      .update(seoPages)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(seoPages.id, id))
      .returning();
    if (!row) throw new NotFoundException('Intrare SEO inexistentă');
    return row;
  }

  async remove(id: string) {
    const row = await this.db.query.seoPages.findFirst({ where: eq(seoPages.id, id) });
    if (!row) throw new NotFoundException('Intrare SEO inexistentă');
    if (row.path === GLOBAL) {
      // Nu ștergem rândul de valori implicite globale.
      throw new NotFoundException('Valorile implicite globale nu pot fi șterse');
    }
    await this.db.delete(seoPages).where(eq(seoPages.id, id));
    return { success: true };
  }
}
