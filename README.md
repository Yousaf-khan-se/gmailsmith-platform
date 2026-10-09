# gmailsmith-platform

Platform repository for **GmailSmith** — the distribution/marketing site and
its supporting glue. Separate from the desktop app repo (`gmail-merge/`) per
the decision record in `docs/11` §11.3.

| Folder | Contents | Spec |
| :--- | :--- | :--- |
| `web/` | Astro static site: landing, download, `/install`, pricing, legal, `/verify` + `/reset` (Firebase action pages), future blog/docs | `gmail-merge/docs/08-website-distribution.md` (§8.1, §8.6) + `docs/11` §11.6 |
| `releases-upload/` | Script pushing `dist/` artifacts (installer, `latest.json`, `SHA256SUMS.txt`) to Cloudflare R2 after `tools/build.py` | `gmail-merge/docs/08` §8.1, §8.6 |
| `functions/` | Reserved — Lemon Squeezy → account webhook (Phase P6) | `gmail-merge/docs/11` §11.8 |

**Stack:** Astro (static) on Cloudflare Pages · installer on R2 behind
`/releases/*` (Worker 302) · auth by Google Firebase Authentication — the
*account* system lives in the app repo's `auth_client.py`, not here.

**Commands (from `web/`):**

```bash
npm install      # first run
npm run dev      # local preview
npm run build    # emits dist/ — what Pages serves
```

**Release uploads (from `releases-upload/`):**

```bash
pip install -r requirements.txt
python upload_release.py --dist ../../gmail-merge/dist
```

Environment for uploads (never commit): `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (default
`gmailsmith-releases`).
