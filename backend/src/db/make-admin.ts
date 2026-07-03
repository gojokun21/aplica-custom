import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Promovează un utilizator existent la rolul ADMIN.
 * Utilizare: npm run make-admin -- email@exemplu.com
 */
async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error('❌ Lipsește emailul. Utilizare: npm run make-admin -- email@exemplu.com');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const [updated] = await db
    .update(schema.users)
    .set({ role: 'ADMIN', updatedAt: new Date() })
    .where(eq(schema.users.email, email))
    .returning();

  if (!updated) {
    console.error(`❌ Niciun utilizator cu emailul ${email}.`);
    await pool.end();
    process.exit(1);
  }

  console.log(`✅ ${email} este acum ADMIN.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
