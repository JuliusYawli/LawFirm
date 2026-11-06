# Full Stack Website Implementation Plan

> Execute natively in this session with checks after each task.

**Goal:** Add bilingual content and durable appointment requests for Vercel.
**Architecture:** Static frontend and Node serverless API with hosted Postgres.
**Tech Stack:** JavaScript, Node.js 22+, postgres, node:test.
**Spec:** docs/superpowers/specs/2026-11-06-full-stack-design.md

## Global Constraints
Preserve existing design. No invented business details. No public request listing. No false success without persistence. Secrets remain server-side.

## Review Focus
Storage unavailable: preserve form input and explain failure.
Browser storage disabled: chooser and switcher still work.
Malformed or oversized requests: reject before database access.
Concurrent submissions: enforce database rate limits atomically.
Mobile/keyboard users: accessible dialog, labels and responsive form.

## Tasks
- [x] Backend: add API handler, shared validation, Postgres schema and setup script; exercise validation, HTTP errors, rate limits and persistence through injected repository tests.
- [x] Frontend: extract styles and scripts into public assets; translate every text node via a complete English dictionary; add chooser, switcher and bilingual request form. Verify both languages, remembered preference, keyboard flow and form failure.
- [x] Delivery: add local server, Vercel static build, environment example and README; run tests/build and browser checks. Document live database verification limits.

## Verification record
Backend tests and static build pass. Browser checks cover English/Portuguese, first visit, stored preference, disabled storage, image and links, mobile overflow, and preservation of form values on HTTP 503. Fresh reviewer found a no-JavaScript GET fallback: added POST action, disabled-until-ready submit and email fallback; regression test failed before fix and passes afterward. Hosted Postgres persistence awaits credentials.
