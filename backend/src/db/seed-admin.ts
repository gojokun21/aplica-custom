import 'dotenv/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Creează (sau promovează) contul de administrator.
 * Configurabil din .env — fără secrete în cod:
 *   ADMIN_EMAIL     (default: admin@aplica.md)
 *   ADMIN_PASSWORD  (dacă lipsește, se generează una aleatorie și se afișează o dată)
 *   ADMIN_FIRST     (default: Admin)
 *   ADMIN_LAST      (default: aplica)
 *
 * Idempotent: dacă emailul există, îi setează rolul ADMIN (și parola, dacă e dată).
 * Utilizare: npm run seed-admin
 */
async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@aplica.md').toLowerCase();
  const firstName = process.env.ADMIN_FIRST || 'Admin';
  const lastName = process.env.ADMIN_LAST || 'aplica';

  // Parola: din env sau generată (o afișăm o singură dată).
  const provided = process.env.ADMIN_PASSWORD;
  const generated = !provided;
  const password = provided || randomBytes(9).toString('base64url');
  const passwordHash = await argon2.hash(password);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  });

  if (existing) {
    await db
      .update(schema.users)
      .set({
        role: 'ADMIN',
        ...(provided ? { passwordHash } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id));
    console.log(`✅ ${email} este acum ADMIN${provided ? ' (parolă actualizată)' : ''}.`);
  } else {
    await db.insert(schema.users).values({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    });
    console.log(`✅ Cont ADMIN creat: ${email}`);
    if (generated) {
      console.log(`\n🔑 Parolă generată (schimb-o după prima autentificare):\n   ${password}\n`);
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
