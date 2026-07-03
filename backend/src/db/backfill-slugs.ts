import 'dotenv/config';
import { eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { ensureUniqueSlug } from '../common/slug.util';

/**
 * Completează slug-ul (din nume) pentru profilurile de freelancer care nu au unul.
 * Idempotent — sare peste cele care au deja slug.
 * Utilizare: npm run backfill-slugs
 */
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  // --all: regenerează toate slug-urile (ex. la schimbarea schemei nume -> username).
  if (process.argv.includes('--all')) {
    await db.update(schema.freelancerProfiles).set({ slug: null });
  }

  const rows = await db.query.freelancerProfiles.findMany({
    where: isNull(schema.freelancerProfiles.slug),
    with: { user: true },
  });

  let updated = 0;
  for (const p of rows) {
    // Username = partea locală a email-ului (ex. ion.popescu@x.com -> ion-popescu).
    const base = (p.user?.email?.split('@')[0] ?? '').trim() ||
      `${p.user?.firstName ?? ''} ${p.user?.lastName ?? ''}`.trim();
    const slug = await ensureUniqueSlug(
      base,
      async (s) =>
        !!(await db.query.freelancerProfiles.findFirst({
          where: eq(schema.freelancerProfiles.slug, s),
        })),
    );
    await db
      .update(schema.freelancerProfiles)
      .set({ slug })
      .where(eq(schema.freelancerProfiles.id, p.id));
    updated += 1;
  }

  console.log(`✅ Slug-uri completate: ${updated} (din ${rows.length} fără slug).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
