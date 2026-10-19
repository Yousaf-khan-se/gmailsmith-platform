# gmailsmith-platform

Platform repository for **GmailSmith** — the distribution/marketing site and
its supporting glue. Separate from the desktop app repo (`gmail-merge/`) per
the decision record in `docs/11` §11.3.

| Folder | Contents | Spec |
| :--- | :--- | :--- |
| `web/` | Astro site — landing with `latest.json`-driven download + pricing, `/install` (SmartScreen guide), `/verify` + `/reset` (Firebase action pages), `/privacy` + `/terms` (rendered from `src/content/legal/`, copied from the app repo's `docs/legal/` — that remains the source of truth), 404, robots + sitemap | `gmail-merge/docs/08` (§8.1, §8.6) + `docs/11` §11.6 |
| `waitlist-worker/` | Separate Cloudflare Worker + D1 for the one-time availability waitlist, Turnstile validation, expiry cleanup, and private CSV export tooling | `gmail-merge/docs/08` §8.7 |
| `releases-upload/` | Script pushing `dist/` artifacts (installer, `latest.json`, `SHA256SUMS.txt`) to Cloudflare R2 after `tools/build.py` | `gmail-merge/docs/08` §8.1, §8.6 |
| `functions/` | Reserved — Lemon Squeezy → account webhook (Phase P6) | `gmail-merge/docs/11` §11.8 |

**Stack:** Astro (static) on Cloudflare — deployed as a **static-asset
Worker** (Workers Builds + `web/wrangler.jsonc`) · installer on R2 behind
`/releases/*` (Worker + R2 binding) · one-time waitlist on a separate Worker
and D1 database behind `/api/waitlist` · auth by Google Firebase Authentication — the
*account* system lives in the app repo's `auth_client.py`, not here.
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

The website is in waitlist mode while Gmail sending scope verification is
pending (`web/src/site.ts`). Configure the Turnstile site key in the static
site build environment, create and migrate D1, and deploy the waitlist Worker
before publishing the form. See `waitlist-worker/README.md` for setup, private
CSV export, launch-email handling, and retention cleanup. The app repo remains
the source of truth for the policy mirrored at `/privacy`.
