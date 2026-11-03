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

# For a later mandatory-update release, choose a migration window and then
# pass the minimum supported version. The app sends no version telemetry, so
# this timing cannot be confirmed from a measured installed-version fleet.
# Example future release:
# python tools/build.py --force-below 1.0.2

# 2. upload (platform repo, credentials in the environment)
python releases-upload/upload_release.py --dist ../../gmail-merge/dist
```

`latest.json` is served with `max-age=60`; artifacts get a day of caching and
`Content-Disposition: attachment`. The app's update banner polls
`/releases/latest.json` cross-origin — CORS is open (`*`) on purpose.
The manifest's optional `force_below` field is checked before sign-in and
outdated clients receive a direct link to the installer named in the manifest.
GmailSmith 1.0.2 was the first migration release with the direct update screen;
its floor is unset. Earlier clients can use their existing optional homepage
prompt to migrate. A later floor is a client-side update gate, not tamper-proof
access control against a modified binary.
