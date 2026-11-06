# Vercel full stack website

## Intent
Preserve the existing law office website and add Portuguese/English language selection plus contact and appointment requests. The user will host on Vercel.

## Approach
Use the existing static HTML/CSS frontend, Vercel Node.js serverless API routes, and hosted Postgres configured through DATABASE_URL. Local SQLite was considered for local hosting; Vercel deployment requires external durable storage. A larger application framework adds unnecessary migration work for this single-page website.

## Visitor experience
Show a keyboard-accessible language chooser on the first visit. Remember the choice locally, and provide a permanent language switcher. Translate all visible page content, form labels, validation, confirmation and error messages. Preserve the current typography, colors, portrait and responsive layout.

Add a contact form collecting name, email, an optional preferred appointment date and a brief message. Explain that submitting a request does not confirm an appointment and ask visitors to avoid sensitive documents. Keep the existing email links as a contact alternative. Show success only after the database confirms a saved request; preserve input on failure.

## Backend and persistence
POST /api/requests validates type, length, email, date and request size on the server. Store a generated identifier, submitted fields, chosen language, timestamp and initial pending status in Postgres. Use parameterized queries, a honeypot and database-backed rate limiting. No public endpoint exposes stored requests. Provide SQL schema and local/Vercel setup instructions. Secrets stay in environment variables and are never sent to the browser.

## Scope and constraints
No admin panel, automatic email notifications, document upload or automatic appointment booking. Requests are reviewed through the database provider console. No invented office credentials or business details. Privacy copy must describe actual form storage and language preference storage.

## Implementation choices
Use plain JavaScript and a minimal Postgres client. The database provider is interchangeable via DATABASE_URL; deployment requires the user to create/connect hosted Postgres and supply its connection string. Include a local development server that serves the frontend and API. Test server validation, database integration when credentials are available, translations, chooser behavior and mobile layout. Without database credentials, verify errors are explicit and no submission is falsely reported as saved.
