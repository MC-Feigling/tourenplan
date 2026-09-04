# Tourenplan — UX-Fundament Quick Wins

**Datum:** 2026-09-04  
**Status:** Implemented  
**Branch:** `cursor/ux-fundament-design-06c0`

## Kontext

MVP (Phasen 1–7) ist fertig. Fokus dieses Pakets: kleine, parallele Wins in Disposition, Fahrer-PWA und Ops/Polish — ohne neue Domänen oder Infra.

## Ziele

- Weniger leere/kaputte Momente (Loading, Empty, Fehler)
- Fahrer: Tour-Alltag greifbarer (Navigation, Status klar)
- Disposition: Woche lesbarer (Skeleton, Empty, Konflikte kompakt)
- Ops: eigenes Passwort ändern

## Out of Scope

- CSV/Excel-Import, Push-Notifications, PDF/Druck, Tour-Schnellanlage
- Multi-Depot, neue Compliance-Profile, LDAP, Tacho, GPS-Live
- Light-Theme, vollständige Nutzer-CRUD, E-Mail-Passwort-Reset
- Offline-Sync, Playwright-E2E in diesem Paket

## Erfolgskriterien

| Rolle | Kriterium |
|-------|-----------|
| Disponent | Leere Woche und Konflikte auf einen Blick verständlich |
| Fahrer | Stop → externe Navigation in ≤2 Taps |
| Alle | Eigenes Passwort ändern ohne Admin |

---

## Disposition

### Skeleton-Loading

- Skeleton nur beim Initial Load (`pending && !data`)
- Platzhalter: Wochenraster (7 Tages-Spalten) + Resource-Sidebar
- Bei Refresh: bestehende Touren sichtbar; Hinweis „Aktualisiere…“ bleibt

### Empty State Woche

- Wenn `tours.length === 0` und nicht loading: `UiEmptyState`
- Titel: „Keine Touren in dieser Woche“
- Beschreibung: kurz, handlungsorientiert
- CTAs: `/dispatcher/lines` und `/dispatcher/tours/new` (bestehende Routes)

### Konflikte kompakt

- Keine neue Validierungs-Engine
- Pure Function aggregiert pro Woche: für jede Tour `summarizeTourAssignment` (bereits in `shared/assignment/weekSummary.ts`); zählt Touren mit Status `error` oder `warning`
- Ergebnis: `{ count, dates: string[], tourIds: string[] }`
- Anzeige im Wochenkopf via `WeekConflictSummary.vue`: z.B. „2 Konflikte · Di, Mi“
- Klick: Highlight betroffener Tour-Cards in der Grid (CSS-Klasse, kein Filter-Hide)

### Betroffene Dateien (Orientierung)

- `components/dispatcher/WeekPlanner.vue`
- `components/dispatcher/WeekPlannerGrid.vue`
- `components/dispatcher/WeekPlannerToolbar.vue`
- `pages/dispatcher/index.vue`
- `shared/assignment/*` (Pure Aggregation, falls sinnvoll)

---

## Fahrer-PWA

### Heute-Fokus

- Bereich „Heute“ bleibt oben, visuell klarer hervorgehoben
- Keine Tour heute: `UiEmptyState` — „Heute keine Tour“ + Hinweis auf nächstes Tour-Datum (falls in der geladenen Woche vorhanden)
- Wochen-Navigation unverändert

### Maps-Deep-Link

- In `DriverStopTimeline`: Aktion „Navigieren“ pro Stop
- Utility `buildMapsNavUrl(stop)` in `shared/` (pure, getestet):
  1. Wenn `lat` + `lng` gesetzt → `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`
  2. Sonst wenn `address` nicht leer → `destination={encodeURIComponent(address)}`
  3. Sonst → `null` (Button ausblenden)
- Link: `target="_blank"`, `rel="noopener noreferrer"`

### Status-Feedback

- Nach erfolgreicher Status-Aktion: kurzer Erfolgshinweis (UAlert success oder gleichwertiges Nuxt-UI-Feedback), z.B. „Tour gestartet“
- Loading am Button bleibt
- Fehler: bestehendes `actionError`; Texte über gemeinsame DE-Konstanten

### Betroffene Dateien

- `pages/driver/index.vue`
- `pages/driver/tours/[id].vue`
- `components/driver/DriverStopTimeline.vue`
- `shared/utils/` (Maps-URL)
- `shared/constants/` (Fahrer-Status-Messages)

---

## Ops / Polish

### Passwort ändern

- Seite: `/account` — alle authentifizierten Rollen
- Navigation: „Konto“ in `AppHeader` (Desktop) und im Driver-Layout-Header (kein neuer Bottom-Nav-Tab)
- API: `POST /api/auth/change-password`
  - Body (Zod): `{ currentPassword: string, newPassword: string }`
  - Konstanten: `CHANGE_PASSWORD_MIN_LENGTH = 8`; `newPassword` ≥ 8, `currentPassword` ≠ leer; `newPassword !== currentPassword`
  - `newPasswordConfirm` nur clientseitig (nicht in API)
  - Flow: Session-User laden → `bcrypt.compare` current → bei Fail `401` → hash new → update `users.passwordHash`
  - Sessions: bestehendes Cookie bleibt gültig; kein Multi-Session-Invalidierung
- UI: Formular current + new + confirm; Erfolg-Meldung; Fehler über `UAlert`

### Empty States

- Disposition-Woche und Fahrer-Heute nutzen `UiEmptyState` wie Admin/Linien
- Gleiches Pattern: Icon-Slot, Titel, Beschreibung, optional CTA

### Fehlertexte

- User-facing Strings in `shared/constants/` (DE)
- Keine Raw-Exception-/Stack-Ausgaben in der UI
- Pattern: `UAlert` mit kurzem Title, optional Description

### Betroffene Dateien

- `server/api/auth/change-password.post.ts` (neu)
- `pages/account.vue` (neu)
- `components/AppHeader.vue`
- `layouts/driver.vue` / Header je nach bestehender Nav
- `shared/constants/auth.ts` (Messages/Limits)
- `stores/auth.ts` (optional Wrapper)

---

## Architektur

Unverändertes Monolith-Layout. Keine neuen Module außer:

| Stück | Art |
|-------|-----|
| `POST /api/auth/change-password` | Nitro Route |
| `/account` | Page |
| `buildMapsNavUrl` | Shared Utility |
| `WeekConflictSummary` | Component |
| Message/Empty-Konstanten | Shared Constants |

```
Disposition: tours + assignment resources (bestehend)
  → UI aggregiert Konflikte clientseitig

Fahrer: tour stops (bestehend)
  → buildMapsNavUrl → externes Maps

Passwort: Form → change-password API → bcrypt → users.passwordHash
```

## Fehlerbehandlung

| Fall | Verhalten |
|------|-----------|
| Falsches aktuelles Passwort | `401`, DE-Message |
| Ungültiges neues Passwort | `400` via Zod/`createError` |
| Tour laden fehlgeschlagen | bestehendes Error-UI, einheitlicher Text |
| Stop ohne Koordinaten/Adresse | Navigieren-Button ausgeblendet |
| Assignment-API-Fehler | bestehendes Feedback; Konflikte nur aus verfügbaren Daten |

## Tests (Vitest)

- `buildMapsNavUrl`: lat/lng, address-only, leer → null
- Zod/Schema oder Pure Validator für change-password Input
- Konflikt-Aggregation: Pure Function mit Fixture-Touren/Findings
- Keine Playwright in diesem Paket

## Umsetzungsreihenfolge

1. Shared Utils + Konstanten + Tests
2. Disposition: Empty, Skeleton, Konflikt-Summary
3. Fahrer: Maps-Link, Status-Feedback, Heute-Empty
4. Passwort-API + `/account` + Nav-Link

## Abgrenzung zu späteren Paketen

Nach diesem Fundament optional (nicht hier):

- Tour-Schnellanlage aus Wochenplan
- Nutzerverwaltung UI
- PDF/Druck Wochenplan
- Push bei Zuweisung
