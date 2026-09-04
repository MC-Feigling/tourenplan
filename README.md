# Tourenplan

Tourenplanung für Busunternehmen — Fuhrpark, Mitarbeiter, Touren, Lenkzeit-Compliance.

## Setup (Entwicklung)

```bash
cp .env.example .env
docker compose up -d
bun install
bun run db:push
bun run dev
```

Erster Login: `admin@localhost.local` / `admin-change-me` (siehe `.env.example`)

## Fahrer-PWA

1. Mitarbeiter in Admin anlegen, Rolle `driver`
2. User mit Rolle `driver` anlegen und in Mitarbeiterprofil verknüpfen (`userId`)
3. Tour zuweisen (Disposition)
4. Als Fahrer einloggen → `/driver` → „Zum Home-Bildschirm hinzufügen“

## Production (Hetzner VPS)

```bash
cp .env.example .env
# DOMAIN, POSTGRES_PASSWORD, NUXT_JWT_SECRET (>=32, unique), NUXT_BOOTSTRAP_* (strong) setzen

docker compose -f docker-compose.prod.yml up -d postgres
bun run db:migrate
docker compose -f docker-compose.prod.yml up -d --build
```

Caddy terminiert TLS automatisch für `DOMAIN` (Port 80/443 offen, DNS A-Record auf VPS).

Updates:

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Tests

```bash
bun run test
bun run build
```

## Stack

Nuxt 4 · PostgreSQL · Drizzle · Pinia · Tailwind · PWA · Caddy

## Docs

- `PROJECT_INFO.md`
- `docs/superpowers/specs/2026-06-28-tourenplan-design.md`
