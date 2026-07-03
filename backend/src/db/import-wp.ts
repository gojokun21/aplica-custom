import 'dotenv/config';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Import freelanceri dintr-un dump WordPress (aplica.md / plugin „workfly").
 * Utilizare:
 *   npm run import-wp -- calea/catre/dump.sql            (dry-run, nu scrie nimic)
 *   npm run import-wp -- calea/catre/dump.sql --commit   (creează conturile)
 */

const PREFIX = 'wps4_';
const DEFAULT_COUNTRY = 'MD';

/* --------------------------- Parser dump SQL ------------------------------ */

/** Extrage toate tuplele din toate statement-urile INSERT pentru un tabel. */
function parseInserts(sql: string, table: string): string[][] {
  const marker = 'INSERT INTO `' + table + '`';
  const rows: string[][] = [];
  let idx = 0;
  while ((idx = sql.indexOf(marker, idx)) !== -1) {
    const valuesIdx = sql.indexOf('VALUES', idx);
    if (valuesIdx === -1) break;
    let i = valuesIdx + 6;
    let depth = 0;
    let inStr = false;
    let cur = '';
    for (; i < sql.length; i++) {
      const c = sql[i]!;
      if (inStr) {
        if (c === '\\') {
          cur += sql[i + 1];
          i++;
          continue;
        }
        if (c === "'") {
          if (sql[i + 1] === "'") {
            cur += "'";
            i++;
            continue;
          }
          inStr = false;
          cur += c;
          continue;
        }
        cur += c;
        continue;
      }
      if (c === ';' && depth === 0) break; // sfârșit statement
      if (c === "'") {
        inStr = true;
        cur += c;
        continue;
      }
      if (c === '(') {
        depth++;
        if (depth === 1) {
          cur = '';
          continue;
        }
      }
      if (c === ')') {
        depth--;
        if (depth === 0) {
          rows.push(splitFields(cur));
          continue;
        }
      }
      if (depth >= 1) cur += c;
    }
    idx = i;
  }
  return rows;
}

/** Împarte o tuplă în câmpuri, respectând string-urile. */
function splitFields(tuple: string): string[] {
  const fields: (string | null)[] = [];
  let inStr = false;
  let isStr = false;
  let cur = '';
  for (let i = 0; i < tuple.length; i++) {
    const c = tuple[i]!;
    if (inStr) {
      if (c === '\\') {
        cur += tuple[i + 1];
        i++;
        continue;
      }
      if (c === "'") {
        if (tuple[i + 1] === "'") {
          cur += "'";
          i++;
          continue;
        }
        inStr = false;
        continue;
      }
      cur += c;
      continue;
    }
    if (c === "'") {
      inStr = true;
      isStr = true;
      cur = ''; // ignoră spațiul dinaintea ghilimelei
      continue;
    }
    if (c === ',') {
      fields.push(isStr ? cur : cur.trim() === 'NULL' ? null : cur.trim());
      cur = '';
      isStr = false;
      continue;
    }
    cur += c;
  }
  fields.push(isStr ? cur : cur.trim() === 'NULL' ? null : cur.trim());
  return fields as string[];
}

/* -------------------------------- Import ---------------------------------- */

async function main() {
  const file = process.argv[2];
  const commit = process.argv.includes('--commit');
  if (!file || !existsSync(file)) {
    console.error('❌ Lipsește calea către dump. Ex: npm run import-wp -- dump.sql [--commit]');
    process.exit(1);
  }

  const sql = readFileSync(file, 'utf8');

  // users: [id, login, pass, nicename, email, url, registered, actkey, status, display_name]
  const users = parseInserts(sql, PREFIX + 'users').map((r) => ({
    id: r[0],
    login: r[1],
    email: (r[4] ?? '').toLowerCase(),
    registered: r[6],
    displayName: r[9] ?? '',
  }));

  // usermeta: [umeta_id, user_id, key, value] -> Map<userId, Map<key,value>>
  const metaByUser = new Map<string, Map<string, string>>();
  for (const r of parseInserts(sql, PREFIX + 'usermeta')) {
    const uid = r[1];
    const key = r[2];
    const val = r[3] ?? '';
    if (!uid || !key) continue;
    if (!metaByUser.has(uid)) metaByUser.set(uid, new Map());
    metaByUser.get(uid)!.set(key, val);
  }

  // posts: attachment id -> guid (URL), pentru avatare
  const guidById = new Map<string, string>();
  for (const r of parseInserts(sql, PREFIX + 'posts')) {
    const id = r[0];
    const guid = r[18];
    const postType = r[20];
    if (id && guid && postType === 'attachment') guidById.set(id, guid);
  }

  const candidates = [];
  for (const u of users) {
    const meta = metaByUser.get(u.id!) ?? new Map<string, string>();
    const caps = meta.get(PREFIX + 'capabilities') ?? '';
    if (/administrator|editor|shop_manager/.test(caps)) continue; // sar peste staff
    if (!u.email || !u.email.includes('@')) continue;

    const nameParts = u.displayName.trim().split(/\s+/);
    const firstName = meta.get('first_name') || nameParts[0] || u.login || 'Freelancer';
    const lastName = meta.get('last_name') || nameParts.slice(1).join(' ') || '.';
    const overview = (meta.get('workfly_bio') || meta.get('description') || '').trim();
    const rateRaw = (meta.get('workfly_rata_ora') || '').replace(/[^\d.]/g, '');
    const rate = rateRaw ? Math.round(parseFloat(rateRaw)) : null;
    const location = meta.get('workfly_locatie') || '';
    const avatarId = meta.get('workfly_avatar') || '';
    const avatarUrl = avatarId ? guidById.get(avatarId) || '' : '';

    candidates.push({
      email: u.email,
      firstName: firstName.slice(0, 100),
      lastName: (lastName || '.').slice(0, 100),
      overview,
      hourlyRateCents: rate != null && !isNaN(rate) ? rate * 100 : null,
      location,
      avatarUrl,
    });
  }

  console.log(`\n📦 WordPress dump: ${users.length} useri, ${candidates.length} freelanceri candidați (fără staff/fără email).`);
  console.log(`   cu tarif: ${candidates.filter((c) => c.hourlyRateCents != null).length} · cu bio: ${candidates.filter((c) => c.overview).length} · cu avatar: ${candidates.filter((c) => c.avatarUrl).length}`);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  let created = 0;
  let skipped = 0;
  const avatarDir = join(process.cwd(), 'uploads', 'avatars');

  for (const c of candidates) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.email, c.email) });
    if (existing) {
      skipped++;
      continue;
    }

    if (!commit) {
      if (created < 8) {
        console.log(
          `   [dry] ${c.email} · ${c.firstName} ${c.lastName} · ${c.hourlyRateCents ? '€' + c.hourlyRateCents / 100 + '/h' : 'fără tarif'} · ${c.location || '—'} · avatar:${c.avatarUrl ? 'da' : 'nu'} · bio:${c.overview.length}c`,
        );
      }
      created++;
      continue;
    }

    // avatar (best-effort)
    let storedAvatar: string | null = null;
    if (c.avatarUrl) {
      try {
        const res = await fetch(c.avatarUrl);
        if (res.ok) {
          if (!existsSync(avatarDir)) mkdirSync(avatarDir, { recursive: true });
          const ext = extname(new URL(c.avatarUrl).pathname).toLowerCase() || '.jpg';
          const fname = `${randomUUID()}${ext}`;
          writeFileSync(join(avatarDir, fname), Buffer.from(await res.arrayBuffer()));
          storedAvatar = `/uploads/avatars/${fname}`;
        }
      } catch {
        /* ignoră avatarul */
      }
    }

    const passwordHash = await argon2.hash(randomBytes(24).toString('hex'));
    const overview =
      c.overview + (c.location ? `${c.overview ? '\n\n' : ''}📍 ${c.location}` : '');

    const [user] = await db
      .insert(schema.users)
      .values({
        email: c.email,
        passwordHash,
        firstName: c.firstName,
        lastName: c.lastName,
        role: 'FREELANCER',
        avatarUrl: storedAvatar,
        emailVerifiedAt: new Date(),
      })
      .returning();

    await db.insert(schema.freelancerProfiles).values({
      userId: user.id,
      overview: overview || null,
      hourlyRateCents: c.hourlyRateCents,
      countryCode: DEFAULT_COUNTRY,
    });
    created++;
  }

  console.log(
    commit
      ? `\n✅ Import complet: ${created} conturi create, ${skipped} sărite (email existent).`
      : `\n🔍 Dry-run: s-ar crea ${created} conturi, ${skipped} sărite (email existent). Rulează cu --commit pentru a scrie.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
