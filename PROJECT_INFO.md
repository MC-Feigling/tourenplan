# Tourenplan — PROJECT_INFO

## Produkt

Web-App für Busunternehmen (Kleinbetrieb): Tourenplanung, Fuhrpark, Mitarbeiter, Fahrerzuweisung mit Lenkzeit-Compliance (DE/EU).

## Zielgruppe

- ≤10 Busse, ≤15 Fahrer, 1–2 Disponenten
- 1 Depot (erweiterbar)

## Rollen

| Rolle | Rechte |
|-------|--------|
| `admin` | Stammdaten, Nutzerverwaltung |
| `dispatcher` | Touren planen, zuweisen |
| `driver` | Eigene Touren lesen, Status |
| `viewer` | Read-only (optional) |

## Tech-Stack

- Nuxt 4 Monolith (Nitro API)
- Vue 3 Composition API, Pinia, TailwindCSS
- PostgreSQL 16 + Drizzle ORM
- JWT HttpOnly Cookie Auth
- MapLibre + OpenRouteService (ab Phase 4)
- PWA (`@vite-pwa/nuxt`)
- Deploy: Docker + Caddy auf Hetzner VPS

## Compliance-Profile

- `STANDARD_561_2006` — Fernlinie, Ausflug
- `LINE_50KM_FPERSV` — Linien ≤50 km
- `OCCASIONAL_2024_1258` — Phase 2

## MVP-Phasen

1. Fundament (Auth, Rollen, Docker) ✅
2. Stammdaten (Fahrer, Busse) ✅
3. Touren (Linien + Ausflug) ✅
4. Karte + ORS-Routing ✅
5. Compliance-Engine + Tests ✅
6. Zuweisung + Ampel ✅
7. Fahrer-PWA + Prod-Deploy ✅

## Nicht im Scope (MVP)

- Tachograph-Anbindung
- CSV/Excel-Import
- GPS-Live-Tracking
- LDAP (Phase 2)

## Git

- Branch: `dev`
- Fixes: erst nach „fix ok?“ committen
- Features: direkt committen

## Env

Siehe `.env.example`
