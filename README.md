# gmailsmith-platform

Platform repository for **GmailSmith** — the distribution/marketing site and
its supporting glue. Separate from the desktop app repo (`gmail-merge/`) per
the decision record in `docs/11` §11.3.

| Folder | Contents | Spec |
| :--- | :--- | :--- |
| `web/` | Astro site — landing with `latest.json`-driven download + pricing, `/install` (SmartScreen guide), `/verify` + `/reset` (Firebase action pages), `/privacy` + `/terms` + `/refund-policy` (rendered from `src/content/legal/`, copied from the app repo's `docs/legal/` — that remains the source of truth), `/contact`, 404, robots + sitemap | `gmail-merge/docs/08` (§8.1, §8.6) + `docs/11` §11.6 |
| `waitlist-worker/` | Separate Cloudflare Worker + D1 for the one-time availability waitlist, Turnstile validation, expiry cleanup, and private CSV export tooling | `gmail-merge/docs/08` §8.7 |
| `account-security-worker/` | Optional future Cloudflare Worker for explicit Firebase refresh-token revocation. Source and local tests exist, but it is not deployed; the app's Settings action currently signs out only this device. | `gmail-merge/docs/11-account-authentication.md` §11.7–11.8 |
| `releases-upload/` | Script pushing `dist/` artifacts (installer, `latest.json`, `SHA256SUMS.txt`) to Cloudflare R2 after `tools/build.py` | `gmail-merge/docs/08` §8.1, §8.6 |
| `functions/` | Reserved for a future Paddle webhook if paid checkout is configured; no integration or webhook is currently active. | `gmail-merge/docs/08` §8.3 |

**Stack:** Astro (static) on Cloudflare — deployed as a **static-asset
Worker** (Workers Builds + `web/wrangler.jsonc`) · installer on R2 behind
`/releases/*` (Worker + R2 binding) · one-time waitlist on a separate Worker
and D1 database behind `/api/waitlist` · optional account-security Worker
source is reserved for optional Firebase refresh-token revocation and is not
deployed; Firebase account sign-in remains in the app repo's `auth_client.py`.
`web/src/firebaseWebConfig.ts` holds the **public** Firebase web config
(by-design values; API-key restrictions in the GCP console are the control).

**Commands (from `web/`):**

```bash
npm install      # first run
npm run dev      # local preview
npm run build    # emits dist/ — what wrangler uploads
```

**Release uploads (from `releases-upload/`):**

```bash
pip install -r requirements.txt
python upload_release.py --dist ../../gmail-merge/dist
```

The upload script validates the installer filename, size and SHA-256 against
`latest.json`, and rejects an invalid `force_below` floor before contacting R2.
Run its local validation suite with:

```powershell
python -m unittest discover -s releases-upload -p "test_*.py"
```

The check verifies the release installer against the manifest using a
streaming SHA-256 pass, so it does not load the installer into memory.

To require a minimum version, pass `--force-below <minimum-version>` to
`tools/build.py` in the app repo. Omit it for ordinary updates and for the
first migration release that adds the direct update screen.

Environment for uploads (never commit): `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (default
`gmailsmith-releases`).

## Current public status (2026-11-03)

GmailSmith 1.0.2 is live as a public Free beta. The site uses download mode,
`/releases/latest.json` serves the 1.0.2 manifest, and paid checkout remains
disabled. Waitlist intake is closed (`WAITLIST_OPEN=false`). Existing
consented addresses remain in D1 under the retention policy; no export or
availability email has been sent because no campaign-provider account is
configured. See `waitlist-worker/README.md` before resuming the one-time notice
process. The app repo remains the source of truth for the legal pages mirrored
at `/privacy`, `/terms`, and `/refund-policy`. Paddle is the intended payment
provider; the refund policy and contact page are ready for its domain review,
but checkout remains disabled until the account and fulfilment are ready.

The waitlist Worker, Turnstile, D1, and site build pipeline are configured and
deployed. Its setup instructions below remain useful if the service is
recreated, but the current form is not accepting new signups.

The optional account-security Worker source and mocked tests live in
`account-security-worker/`. Run `npm test` there for local tests and
`npx wrangler deploy --dry-run` to check the bundle and bindings. It is not
deployed and its cloud setup is deferred; ordinary app sign-in, email sending,
and local sign-out do not depend on it. The Settings action currently clears
this device only, so it must not be presented as working global sign-out.

If remote session revocation becomes a product need, first add a separate
staging configuration and test it with a disposable Firebase project/account.
Only then consider production setup: a dedicated Firebase service identity,
the `firebaseauth.users.update` permission, a Cloudflare secret, and a unique
rate-limit namespace. Never test revocation against a production user. The
current Worker implementation expects a service-account JSON key; review that
credential tradeoff before enabling it. Production deployment is not part of
the current checkpoint.
