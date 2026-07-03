import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Vue.js',
  'Nuxt',
  'Node.js',
  'NestJS',
  'Python',
  'Django',
  'PHP',
  'Laravel',
  'Go',
  'Rust',
  'Java',
  'Spring Boot',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Docker',
  'Kubernetes',
  'AWS',
  'GraphQL',
  'REST API',
  'UI/UX Design',
  'Figma',
  'HTML/CSS',
  'Tailwind CSS',
  'Flutter',
  'React Native',
  'DevOps',
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  await db
    .insert(schema.skills)
    .values(SKILLS.map((name) => ({ name, slug: slugify(name) })))
    .onConflictDoNothing();

  const all = await db.query.skills.findMany();
  console.log(`✅ Seed complet. ${all.length} skill-uri în catalog.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
