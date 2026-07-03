import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Resetează COMPLET baza de date: șterge schema `public` (toate tabelele + datele)
 * și schema `drizzle` (starea migrărilor), apoi le recreează goale.
 * După asta rulează migrările din nou: `drizzle-kit migrate`.
 *
 * ⚠️  DISTRUCTIV — șterge tot. Rulează doar în dev.
 * Utilizare (via npm): npm run db:reset
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ Lipsește DATABASE_URL în .env');
    process.exit(1);
  }

  // Siguranță: nu rula pe o bază care pare „de producție”.
  if (/prod|production/i.test(url)) {
    console.error('❌ DATABASE_URL pare de producție — refuz resetul.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  console.log('🗑️  Șterg schema public + drizzle…');
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE;');
  await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE;');
  await pool.query('CREATE SCHEMA public;');
  console.log('✅ Bază goală. Rulează migrările: drizzle-kit migrate');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
