# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v26.7.0] - 2026-07-09

### Added
- Initial fe-admin Data Generator plugin (S125 · Increment 3): *Sales ▸ Data
  Generator* nav injection, a tabbed page (Datavibes Profiles + Profiles Cron
  Management), the `datavibes-admin` Pinia store and API client over the
  `/api/v1/admin/datavibes/*` contract, and a client-side cron
  validator + next-fire-times preview.
- Declared `dependencies: ['dataset']`.
