# gmailsmith-platform

Platform repository for **GmailSmith** — the distribution/marketing site and
its supporting glue. Separate from the desktop app repo (`gmail-merge/`) per
the decision record in `docs/11` §11.3.

| Folder | Contents | Spec |
| :--- | :--- | :--- |
| `web/` | Astro site — landing with `latest.json`-driven download + pricing, `/install` (SmartScreen guide), `/verify` + `/reset` (Firebase action pages), `/privacy` + `/terms` (rendered from `src/content/legal/`, copied from the app repo's `docs/legal/` — that remains the source of truth), 404, robots + sitemap | `gmail-merge/docs/08` (§8.1, §8.6) + `docs/11` §11.6 |
| `waitlist-worker/` | Separate Cloudflare Worker + D1 for the one-time availability waitlist, Turnstile validation, expiry cleanup, and private CSV export tooling | `gmail-merge/docs/08` §8.7 |
| `account-security-worker/` | Optional future Cloudflare Worker for explicit Firebase refresh-token revocation. Source and local tests exist, but it is not deployed; the app's Settings action currently signs out only this device. | `gmail-merge/docs/11-account-authentication.md` §11.7–11.8 |
| `releases-upload/` | Script pushing `dist/` artifacts (installer, `latest.json`, `SHA256SUMS.txt`) to Cloudflare R2 after `tools/build.py` | `gmail-merge/docs/08` §8.1, §8.6 |
| `functions/` | Reserved — Lemon Squeezy → account webhook (Phase P6) | `gmail-merge/docs/11` §11.8 |

**Stack:** Astro (static) on Cloudflare — deployed as a **static-asset
Worker** (Workers Builds + `web/wrangler.jsonc`) · installer on R2 behind
`/releases/*` (Worker + R2 binding) · one-time waitlist on a separate Worker
and D1 database behind `/api/waitlist` · optional account-security Worker
source is reserved for future Firebase refresh-token revocation and is not
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

Environment for uploads (never commit): `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (default
`gmailsmith-releases`).

The website is currently configured in waitlist mode until the public release
manifest and installer are ready (`web/src/site.ts`). Configure the Turnstile
site key in the static site build environment, create and migrate D1, and
deploy the waitlist Worker before publishing the form. See
`waitlist-worker/README.md` for setup, private
CSV export, launch-email handling, and retention cleanup. The app repo remains
the source of truth for the legal pages mirrored at `/privacy` and `/terms`.

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
