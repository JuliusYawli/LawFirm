# Production audit implementation checklist

## Scope
Static Portuguese/English law-office site, Node.js/Vercel POST API, Postgres, local development server and build. Preserve the current branding and feature set. No deployment, production data changes or fabricated professional identifiers.

## Priorities
1. Enforce authenticated encryption to hosted Postgres; harden request origins, parsers, validation, API headers and local error handling.
2. Prevent duplicate inquiries on retries using per-submission UUIDs and transaction serialization. Add database timeout and rate-limit cleanup index without applying changes to a remote database.
3. Correct favicon MIME, 404 routing, keyboard/navigation behavior, privacy anchors, text contrast and touch targets.
4. Optimize the portrait without changing its appearance; add modern image alternatives, descriptive title and production metadata checks.
5. Write original bilingual privacy/storage/terms content from actual behavior; identify retention, OAB, provider and office-information decisions that remain unresolved.
6. Add meaningful backend/server/build regressions; run tests, syntax checks, production builds and browser QA. Record verified results and launch blockers in docs/production-audit.md.

## Initial findings
Conditional remote-database transport verification failure; missing custom 404; async local-server request failures unhandled; SVG wrong MIME; retries lack idempotency; no explicit CSP/Permissions-Policy; small bronze text contrast 4.4926:1 on cream (below 4.5); privacy lacks retention implementation and language-storage controls; no local database/deployment credentials or Git repository.

## Completion
Implemented the prioritized fixes and recorded the full outcome in docs/production-audit.md. Final verification: 16 automated tests pass, JavaScript syntax checks pass, normal and configured-domain builds verified, bilingual/mobile/keyboard/error-state browser checks completed. Hosted database and deployment verification remain blocked by absent external configuration. No deployment, production migration, fabricated registration or deletion performed.
