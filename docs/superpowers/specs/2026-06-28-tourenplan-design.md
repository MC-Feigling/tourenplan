# Tourenplan — Design Spec

**Datum:** 2026-06-28  
**Status:** Approved

## Entscheidungen

| Thema | Wahl |
|-------|------|
| Betrieb | Klein (≤10 Busse, ≤15 Fahrer) |
| Routing | OpenRouteService + MapLibre |
| Tachograph | Nur Planung |
| Deployment | Hetzner VPS, Docker |
| Import | Manuell |

## Architektur

Nuxt 4 Monolith: `pages/`, `components/`, `server/api/`, `server/database/`, `shared/`.

## Module

1. **Auth** — JWT Cookie, Rollen admin/dispatcher/driver
2. **Stammdaten** — Fahrer, Fahrzeuge, Abwesenheit
3. **Touren** — Linien (wiederkehrend), Ausflüge, Stops
4. **Routing** — ORS Geocode + Directions
5. **Compliance** — VO 561/2006, FPersV ≤50km
6. **Zuweisung** — Fahrer/Bus mit Ampel-Validierung
7. **Fahrer-PWA** — Mobile Tour-Ansicht

## UI

- Disponent: Desktop/Tablet, Wochenkalender
- Fahrer: Smartphone PWA, Bottom-Nav
- Dunkles Theme, Amber-Akzent, Touch ≥44px

## Referenzen

- Azubis: Monolith, Drizzle, Auth
- HotelSphere: Scheduling, PWA
- VO 561/2006, FPersV §1, VO 2024/1258
