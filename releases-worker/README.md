# releases-worker

Serves `gmailsmith.app/releases/*` from the private R2 bucket
`gmailsmith-releases` (R2 binding — the bucket is never public; docs/08 §8.6).

## One-time setup

1. **Cloudflare → R2 → Create bucket** `gmailsmith-releases` (location: Auto).
2. **R2 → Manage R2 API Tokens → Create API token** (Object Read & Write,
   scoped to this bucket). Note the credentials — they feed
   `../releases-upload/upload_release.py` via environment:
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
3. **Deploy the Worker** (needs wrangler auth once):

   ```powershell
   cd releases-worker
   npx wrangler login          # browser OAuth, once per machine
   npx wrangler deploy          # creates the gmailsmith.app/releases/* route
   ```

## Releasing

```powershell
# 1. build (app repo)
python tools/build.py

# 2. upload (platform repo, credentials in the environment)
python releases-upload/upload_release.py --dist ../../gmail-merge/dist
```

`latest.json` is served with `max-age=60`; artifacts get a day of caching and
`Content-Disposition: attachment`. The app's update banner polls
`/releases/latest.json` cross-origin — CORS is open (`*`) on purpose.
