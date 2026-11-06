# Manoel Cavalcanti website

A Portuguese/English law office website with a first-visit language chooser, persistent language switcher and contact/appointment request form. Static pages keep the original design; a Node.js API saves requests to hosted Postgres.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local
# Set DATABASE_URL and RATE_LIMIT_SECRET in .env.local
npm run db:setup
npm run dev
```

Open http://localhost:3000. The interface also runs without database credentials; the form then reports that requests cannot be saved. It never reports success without a successful database write.

```sh
npm test
npm run build
```

`npm run build` produces `dist/`. Vercel deploys the static output and `api/requests.js` separately. Do not deploy only `dist/` to a static host if you need the form.

## Deploy to Vercel

1. Import this repository into Vercel. The included `vercel.json` supplies the build command and output directory; use the Other framework preset if asked.
2. Connect a hosted Postgres database through Vercel Marketplace (for example Neon), or use an existing hosted Postgres database. Use the provider’s pooled, TLS-enabled connection URL.
3. Add server-side environment variables `DATABASE_URL` and `RATE_LIMIT_SECRET` to Vercel. Generate a random secret with `openssl rand -hex 32`. Set them for each deployment environment you use. Never prefix secrets with public/client environment variable names.
4. Run the idempotent `scripts/schema.sql` in your provider’s SQL console, or set the same DATABASE_URL locally and run `npm run db:setup`.
5. Deploy, submit a test request, and confirm a matching row exists in `contact_requests`. Missing database configuration produces an explicit error rather than losing the request silently.

Vercel serverless functions do not store requests on the local filesystem. Database costs and availability depend on your provider.

## Review requests

Use your database provider’s authenticated console to review the private `contact_requests` table, ordered by `created_at`. Each row includes the visitor’s language, contact details, preferred date and a `pending` status. Office staff can update status to `contacted` or `closed`. There is no public listing endpoint or admin panel, and no automatic email notification. Check the table regularly. Preferred dates do not confirm appointments.

Only trusted office staff should have database access. Do not expose these tables through a public data API. Define an office retention policy and delete closed requests when no longer needed; retention is not automatically scheduled by this implementation.

## Behavior and limits

- Language choice is saved in browser local storage; a storage-disabled browser can still choose and switch languages.
- All page content and form status messages are translated. Native date pickers and browser validation messages follow the visitor’s browser settings.
- Names: 2–120 characters. Emails: up to 254. Messages: 10–2,000. Preferred dates are optional and cannot be past dates in the office’s America/Sao_Paulo timezone.
- Server validation, a hidden honeypot, a 12 KB body limit, parameterized SQL and atomic database rate limits (five requests per hour per visitor IP) protect submissions. IPs are HMAC-hashed; rate-limit entries older than two hours are cleaned during successful saves. Hosting providers can retain their own access logs.
- The API has no public read/delete route. Requests are not appointment confirmations and are not an emergency channel.

## Files

- `index.html`: Portuguese source content and form.
- `public/styles.css`, `public/app.js`, `public/translations.js`: design, behavior and English translations.
- `public/assets/manoel.jpg`: portrait.
- `api/requests.js`, `lib/`: request endpoint, validation and database persistence.
- `scripts/`: local server, build and database setup.
- `tests/`: automated backend checks.

## Office information still required

Confirm the lawyer’s OAB number/state, practice areas, biography, street address and office hours. The public phone and Angra dos Reis location are confirmed. Confirm the office’s actual data handling and retention practices before publishing. Existing email contact links remain available.

## Professional website update

The location is Angra dos Reis – RJ, Brasil. Public telephone/WhatsApp: +55 84 99839-3641. The website includes mobile navigation, prominent consultation and WhatsApp links, a consolidated contact/form section, structured business data, a favicon and social previews. The reference comparison and outstanding content are recorded in `docs/website-review.md`.

Set `SITE_URL` in Vercel to your production origin (for example `https://your-domain.com`) and rebuild to generate canonical URLs, an absolute social image URL and `sitemap.xml`. Without it, the build omits canonical/sitemap rather than publishing a guessed domain. `robots.txt` is always generated.

Still provide the actual practice areas, OAB number/state, professional biography/qualifications, full address and office hours. These are not inferred from the reference site. WhatsApp opens a third-party service and does not submit the website form.

## Audit improvements and operations

Run `npm run check` for JavaScript syntax validation, `npm test` for the backend/local HTTP regressions, and `npm run build` before deployment. Local HTTP tests bind temporary loopback ports. See `docs/production-audit.md` for the audit results and outstanding launch checks.

Hosted Postgres connections now enforce TLS and certificate verification even if the URL uses `sslmode=require` or `disable`. For a provider using a private CA, set `DATABASE_CA_CERT` to its trusted PEM certificate. Do not disable verification for a hosted database. Plaintext is available only for loopback databases with the explicit `ALLOW_INSECURE_LOCAL_DB=true` opt-in, outside production. Production requires a RATE_LIMIT_SECRET of at least 32 characters. Generate it with `openssl rand -hex 32`.

The schema setup also creates a rate-limit cleanup index. No remote database was migrated during the audit. Submission retries reuse a UUID and the database serializes duplicate UUID writes within a transaction; older clients without a UUID remain supported. Do not log request bodies, connection strings or user emails.

Language preference expires after 180 days from the latest visit and can be cleared from the Cookies and browser preferences disclosure. The site itself adds no analytics, advertising scripts or nonessential cookies. Inquiry messages have no automatic deletion task; the office must adopt a retention schedule and supervise deletion/access requests. The published notice makes that limitation explicit.

### Release and rollback

1. Configure DATABASE_URL, a strong RATE_LIMIT_SECRET and production SITE_URL in Vercel; configure a trusted CA only if required by your provider.
2. Have an authorized operator run the idempotent schema setup on the intended database, after reviewing it and following the provider’s backup procedures.
3. Verify one test submission in a protected preview and confirm it appears only once in the private database, including after a retry. Review provider console permissions and ensure there is no public table API.
4. Confirm the production 404 returns HTTP 404, HTTPS/certificates and security headers work, canonical/sitemap use the real domain, and office/legal information is correct.
5. Keep the previous successful deployment. If application behavior regresses, use Vercel’s rollback to that deployment. This release adds an index and uses the existing UUID column; do not drop tables or delete requests during rollback.

This directory is not a Git repository, so no commit history or remote CI was available to verify. Put the project under version control and arrange backups before launch. No push or deployment was performed by the audit.
