# vbwd-datavibes (fe-admin) — Data Generator

Admin backoffice plugin for the vbwd-sdk platform. Adds a **Data Generator**
page to the Sales section that drives the backend `vbwd_datavibes` plugin
(S125).

## Page — Data Generator

Two component-level tabs:

1. **Datavibes Profiles** — the catalogue of datavibes dataset profiles
   (slug / title / category, latest snapshot timestamp, row count, report links
   for `analytics.md` / `statistics.md` / `report.pdf`). Row action **Run now**;
   clicking a row opens a detail drawer with the resolved config summary and
   report links.
2. **Profiles Cron Management** — per-profile schedule editor: a validated
   `cron_expr` input (with a client-side "next fire times" preview), an
   `enabled` toggle, the last run + status badge and next run. **Save** upserts
   the schedule; **Run now** triggers the scheduled profile immediately.

## Backend contract (S125 §3.5)

| Method + path | Purpose |
|---|---|
| `GET  /api/v1/admin/datavibes/profiles` | list profiles |
| `GET  /api/v1/admin/datavibes/profiles/<slug>` | profile detail |
| `POST /api/v1/admin/datavibes/profiles/<slug>/run` | run now |
| `GET  /api/v1/admin/datavibes/schedules` | list schedules |
| `PUT  /api/v1/admin/datavibes/schedules/<slug>` | upsert (`cron_expr`, `enabled`) |
| `POST /api/v1/admin/datavibes/schedules/<slug>/run` | manual trigger |

## Dependencies

Declares `dependencies: ['dataset']` — the platform `PluginRegistry` resolves
and orders plugins and errors when the `dataset` peer is missing. Report
companions are served through the existing dataset download routes.

## Development

```bash
# fe-admin unit tests (root config discovers plugins/*/tests)
cd vbwd-fe-admin
npm run test -- plugins/vbwd-datavibes/
npm run lint
```

## License

Business Source License 1.1 — see `LICENSE`.
