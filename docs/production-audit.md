# Production audit — 6 November 2026

## 1. Project overview

**Result: 68/100, launch blocked pending database configuration and business/legal confirmation.** This is an engineering readiness assessment, not a security or legal certification. Local technical checks pass, but the production submission path cannot be verified without hosted Postgres and Vercel configuration.

The project uses static HTML/CSS, browser JavaScript, one Vercel Node.js API route, Postgres.js 3.4.9 (locked), hosted Postgres, and Node's built-in test runner. It has Portuguese/English selection, an inquiry/appointment-request form, telephone/email/WhatsApp links, expandable consultation guidance and legal disclosures. It has no accounts, authentication sessions, checkout, subscriptions, payments, document uploads or public database-reading endpoints. Those audit categories are not applicable.

Source, scripts, tests, configuration and relevant documentation were inspected before fixes. A separate read-only security reviewer checked the server/database boundaries and later reviewed the patch. This directory has no Git repository or CI history. No deployment, push, production migration or deletion was performed.

## 2. Issues discovered

| Priority | Finding | Outcome |
| --- | --- | --- |
| Critical | No critical source-backed vulnerability identified within reviewed scope | Production evidence remains limited |
| High launch priority | No local database credentials or production domain/configuration; actual saving cannot be tested | Owner configuration and staging verification required |
| High launch priority | OAB identification, actual practice areas, full address, biography and retention decisions unavailable | Not fabricated; owner/legal confirmation required |
| Low conditional security | Hosted database TLS/certificate verification depended on URL settings; driver defaults could allow plaintext or unverified certificates | Application now enforces verified TLS |
| Medium reliability | An uncertain timeout/retry could create duplicate inquiries | Client retry UUIDs and transaction-serialized deduplication added |
| Medium reliability | Aborted local HTTP requests could produce uncaught async errors | Server boundary catches stream/parser failures; regression verified |
| Medium privacy | Storage/retention behavior, external-service processing and browser preference controls were incomplete | Original bilingual disclosures and clear-language-preference control added |
| Low accessibility | Small bronze text measured 4.4926:1 on cream, slightly below the 4.5 target | Changed to a matching darker bronze: 4.6935:1 |
| Low usability | Missing branded 404; incorrect SVG MIME locally; collapsed policy links | Branded 404, MIME correction and disclosure-opening navigation added |
| Low hardening | CSP and Permissions-Policy were absent | Added consistently to local and Vercel responses |
| Low performance | Portrait delivered as a 338,042-byte JPEG on every device | Responsive WebP sources added with JPEG fallback |

## 3. Fixes implemented

- `lib/database-options.mjs`: verified TLS independent of connection URL SSL modes; optional trusted custom CA; plaintext only with explicit loopback development opt-in, never production; query timeout.
- `lib/database.mjs`: production secret minimum length, UUID advisory transaction locking, matching-payload retry deduplication, safe UUID conflict handling. Older clients without requestId remain supported. No production database changes were made.
- `lib/requests.mjs`: strict JSON media type, same-host browser-origin/cross-site checks, control-character and malformed-Unicode rejection, UUID validation, safe no-store responses. Existing bounds, date checks, honeypot, HMAC IP keys and parameterized SQL remain.
- `scripts/schema.sql`: idempotent index for old rate-limit entry cleanup; not applied to a remote database.
- `lib/security-headers.mjs` and `vercel.json`: CSP, Permissions-Policy, nosniff, framing protection and referrer policy. Build verifies configuration consistency. API responses remain no-store. Vercel manages production HTTPS/CDN behavior; this was not deployed to verify it.
- `scripts/dev.mjs`: robust outer request handling, aborted-request tolerance, explicit SVG/WebP types, realpath confinement, private-source 404 behavior and branded missing routes. It remains loopback-bound.
- `public/404.html`: branded, bilingual, noindex page with home navigation. Local missing routes return 404 rather than 200. Vercel output includes 404.html; deployed behavior still requires checking.
- `public/app.js`: stable UUID on retries, timeout cleanup through AbortController, preference expiry and removal, policy/accordion deep-link opening, outside-menu dismissal, explicit dialog focus return and existing reduced-motion support.
- `index.html`, `public/styles.css`, `public/translations.js`: descriptive title, responsive modern portraits, correct image dimensions, linked privacy notice/contact email, original policy wording, browser-storage disclosure, improved small-text contrast, mobile targets and print visibility. Removed obsolete inquiry CSS and 47 unused translation entries before adding the final disclosures. Branding, section flow, animations, location, contact numbers and backend features are preserved.
- `scripts/check.mjs`, `tests/`: syntax check and security/server/build regression coverage.

## 4. Security findings

The managed baseline scan recorded one conditional database transport issue. It is **fixed in the current source** by explicit certificate verification. The baseline report describes the pre-fix snapshot, not the final code:

[Managed baseline security report](/Users/jy/.codex/state/plugins/codex-security/scans/manoel-cavalcanti-website/unversioned_20261106T185016Z__n44wweh/report.md)

No confirmed SQL injection, stored/reflected XSS route, credential exposure, broken account authorization or public inquiry read/delete endpoint was found in the reviewed source. This does not prove the absence of vulnerabilities. Submitted text is not publicly rendered; SQL values are parameterized; schema unsafe() executes a trusted local SQL file. No application CORS permission is granted to other origins. Anonymous non-browser contact submission remains intentionally possible and is rate-limited.

The patch reviewer found no material defects in TLS enforcement, transaction retry locking, origin checks, local request handling or static-source confinement. Live database ACLs, provider public APIs, backup permissions, actual certificate trust and transaction behavior remain unverified. Restrict database console access to office staff and do not expose the tables through a public data API. Apply provider-level abuse protections if real traffic requires them; no invasive external testing was performed.

The only production dependency is locked Postgres.js 3.4.9. Its maintainer's security page showed no published advisories when checked; that is **not** a complete registry/dependency-vulnerability scan. No unpinned remote scanner or code upload was used. [Maintainer source](https://github.com/porsager/postgres/security).

## 5. Legal and privacy review

Original Portuguese/English wording now describes submitted fields, purposes, authorized office access, hosting/database processing, possible provider-dependent international transfers, external links, rights-request contact and verification, no automatic inquiry deletion, and limitations of appointment requests. Terms explain responsible use and that form/WhatsApp/email contact does not establish representation or confirm deadlines.

The site itself sets no cookies in a clean browser context and loads no analytics, advertising SDK, remote font, embedded map or payment SDK. Its own browser storage contains only the expiring language choice. A clear control removes it; choosing language remains possible when storage is blocked. No tracking-consent banner was added for nonexistent trackers. This is an implementation observation, not a legal finding that consent can never be required. Reassess if integrations change, using the [ANPD cookie guidance](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais).

Only name, email, short message, optional preferred date, language and a technical submission UUID are accepted. Rate limiting uses an HMAC-derived IP identifier; raw IP is not stored by that control, although the host may log it. Old rate keys are cleaned during successful new submissions, not by a scheduled job; this limitation is disclosed. Inquiry messages have no automatic deletion task. No production data was deleted.

**Business/legal confirmation remains necessary:** real OAB number/state and office identity; practice areas/qualifications; street address/hours; responsible controller contact details as applicable; actual providers and storage region; legal basis and retention schedule; process for rights requests and any provider access/export requirements. A possible retention period may be proposed internally, but no unadopted rule or invented identifier was published. Policy wording is drafted for this implementation and requires professional review before public reliance.

Refund, account deletion, pricing, subscription renewal, hidden fees and payment security are not implemented product flows. No fake reviews, awards or guaranteed outcomes were introduced. The website does not take payment or set legal-service refund rules.

## 6. Performance and SEO

| Asset | Bytes | Reduction versus original JPEG |
| --- | ---: | ---: |
| Original JPEG fallback/social image | 338,042 | — |
| 560px WebP | 17,682 | 94.8% |
| 1117px WebP | 50,964 | 84.9% |

Browser source selection was verified. Hero stays eager/high priority; profile stays lazy; intrinsic dimensions now match the actual portrait. No new package dependencies were added. Existing Vercel static delivery/caching is retained; local development uses no-store. No real-world loading-speed or Core Web Vitals improvement is claimed; no field data or throttled performance trace was collected.

The main page and 404 have descriptive distinct titles, viewport/meta descriptions, appropriate headings and informative image alt text. The 404 is noindex. Existing local-business structured data uses only supplied name/contact/city facts, with no invented registration, hours or ratings. Internal navigation and policy links resolve. Canonical, absolute social image, robots and sitemap outputs were verified with a temporary example domain; the final build omits the example domain. Set the real production SITE_URL and rebuild. English is a client language choice at the same URL; no separate English URL or unsupported hreflang was invented.

CNA and OABRJ official destinations loaded during the external-link check. The TJRJ check timed out; its official destination was retained rather than incorrectly classified as broken. Telephone, email and WhatsApp URI formats were checked without sending messages.

## 7. Test results

- **16/16 automated tests passed; 0 failed, 0 skipped.** Includes certificate settings, production secret validation, input rejection, safe origin checks, API status/error behavior, UUID propagation/conflicts, no-JavaScript form safety, section order, 404/private-file isolation, favicon MIME, aborted/malformed/oversized requests and production-build artifacts.
- **JavaScript syntax checks passed.** There is no separate lint/style or TypeScript configuration; no TypeScript/React checks are applicable.
- **Production build passed**, both without a domain and with a temporary valid HTTPS SITE_URL. Insecure production SITE_URL rejection verified. Final normal build contains no invented canonical domain.
- **Browser checks passed:** Portuguese/English translation coverage; first-visit chooser and initial button focus; saved preference and clear control; absent app cookies in isolated context; label associations; mobile menu/Escape/focus behavior; policy opening; image source; no dead internal anchors; no horizontal overflow at 320, 390, 768, 1024 and 1440px; no warnings/errors in clean console before intentional API error tests.
- **Form UI checked:** mocked 503 preserves input; retry uses the same UUID; mocked 201 announces success and clears input. A real local submission without credentials returns a safe failure. Mocked success is not a claim of database persistence.
- **Not performed:** live Postgres save/dedup/ACL/retention checks, production Vercel request/404/header/HTTPS checks, screen-reader assistive-technology sessions, full WCAG conformance assessment, field Core Web Vitals, complete vulnerability-registry scan, commercial legal review or CI runs. Required environment, deployment, tools or owner decisions are absent.
- The sandbox initially denied local test ports (EPERM); the permitted rerun bound temporary loopback ports and passed. This was an environment restriction, not a remaining application failure.

## 8. Remaining tasks

1. Create/connect hosted Postgres; set DATABASE_URL and a random RATE_LIMIT_SECRET of at least 32 characters. Set DATABASE_CA_CERT only if the provider requires a private CA; never disable remote verification.
2. Review and run the idempotent schema setup as an authorized operator, following provider backup procedures. No remote schema was changed by this audit.
3. Set the production HTTPS SITE_URL; run a protected preview submission, verify one private database row, retry behavior and successful staff follow-up. The office must monitor the database: no automatic email notification or admin panel exists.
4. Confirm actual office/OAB details, areas, biography, address/hours, providers/regions and retention/rights procedure. Request legal review of the original policy drafts. Do not replace these facts with fabricated values.
5. Add version control, backups and an operational owner. README documents release verification and rollback to the previous successful Vercel deployment without deleting tables or inquiries.
6. After an explicitly authorized deployment, verify real 404 status, HTTPS, headers, canonical/sitemap, private-table controls and browser behavior. Conduct assistive-technology and real-network performance checks as appropriate.

## 9. Production readiness

**The current source is improved and locally verified, but the complete application is not yet ready for an unqualified production launch.** The contact form still requires external database configuration and a real end-to-end save test. Professional identification and data-governance decisions require owner/legal confirmation. No critical exploit was found in reviewed source, but security, accessibility and legal compliance are not guaranteed. The original identity and requested navigation remain intact; Immediate support and Partners are removed, the profile is under About us, WhatsApp is confined to contact, and no map is embedded.
