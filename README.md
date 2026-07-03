# aplica

Marketplace de freelancing pentru [aplica.md](https://aplica.md) (Moldova) — tip Upwork.

## Stack

- **Backend** — NestJS 11 + Drizzle ORM + PostgreSQL (port `3001`)
- **Frontend** — Nuxt 4 + Tailwind CSS v4 (port `3000`)
- **Real-time** — Socket.IO (chat + notificări)
- **DB** — PostgreSQL în Docker (`docker-compose.yml`, port `5544`)

## Funcționalități

Autentificare JWT (access + refresh cu rotație) · profiluri freelancer/client · skill-uri · căutare talente · anunțuri de proiecte + aplicări + selecție · chat în timp real · livrare + finalizare (dublă confirmare) · recenzii & rating · notificări (real-time + email) · upload avatar · setări cont · panou de admin (moderare useri/proiecte/recenzii, SEO, pagini legale) · editor rich-text (TinyMCE).

## Pornire locală

```bash
# 1. Baza de date
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # completează secretele (JWT, SMTP, DATABASE_URL)
npm install
npm run db:migrate
npm run start:dev           # http://localhost:3001

# 3. Frontend
cd ../frontend
npm install
npm run dev                 # http://localhost:3000
```

## Scripturi utile (backend)

| Comandă | Descriere |
|---|---|
| `npm run db:generate` | generează migrări Drizzle |
| `npm run db:migrate` | aplică migrările |
| `npm run db:seed` | populează date de test |
| `npm run make-admin` | promovează un user la ADMIN |
| `npm run import-wp -- dump.sql [--commit]` | importă freelanceri dintr-un dump WordPress |

> **Notă:** `.env` (parole SMTP/DB, chei JWT) NU este versionat. Folosește `.env.example` ca șablon.
