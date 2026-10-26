# GmailSmith account-security Worker (optional, deferred)

**Status:** source and mocked tests are present, but this Worker has not been
deployed. Global Firebase session revocation is a future recovery capability,
not a requirement for normal GmailSmith sign-in, sending, or local sign-out.
Until deployment, the app's Settings action signs out this device only; remote
revocation on other devices is unavailable.

This Worker exposes one authenticated recovery operation:

```text
POST /api/account/revoke-sessions
Authorization: Bearer <fresh Firebase ID token>
```

It verifies the Firebase token signature and claims, requires a recent
authentication (`auth_time` within five minutes), and revokes refresh tokens
for the UID taken from the verified token. It does not accept a user ID in the
request body, store account records, or return the user's identity. A successful
revocation may not invalidate already-issued Firebase ID tokens until their
normal expiry; the desktop app must clear its own local session immediately.

## Future deployment checklist

Complete this setup only if remote session revocation becomes a product need.
The current `wrangler.jsonc` targets the production route; create a separate
staging configuration and use a separate Firebase test project first. Never
test revocation against a production user.

The current Worker expects a user-managed service-account JSON key. Google
recommends avoiding these keys when possible. If this design is retained, use
a dedicated service account with only `firebaseauth.users.update`, keep the
key only as a Cloudflare Worker secret, and review the key-management risk
before enabling production.

1. Create a dedicated Google Cloud service account for this Worker. Grant it a
   custom role with only `firebaseauth.users.update` on the test Firebase
   project. The Worker exchanges a short-lived service-account assertion for an
   OAuth token using the `identitytoolkit` scope, then calls the Identity
   Toolkit `accounts:update` method to set the user's `validSince` timestamp.
2. Deploy the staging Worker once, then store the test service-account JSON as
   its Cloudflare secret. Setting a secret creates and deploys a new Worker
   version. From this directory, run:

   ```powershell
   npx wrangler secret put FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON --config wrangler.staging.jsonc
   ```

   Wrangler prompts for the value. Never put the JSON key in this repository,
   `wrangler.jsonc`, logs, or a desktop build. Rotate/delete the key if it is
   ever exposed.
3. Confirm that the `REVOCATION_RATE_LIMITER` namespace ID in the staging
   configuration is unique within the Cloudflare account. The configuration allows
   three requests per UID per minute; Cloudflare's rate-limit counters are
   approximate and location-scoped.
4. Use a Firebase test project and a disposable account for staging. Do not
   test revocation against a production user.

## Development and tests

Run the tests with:

```powershell
npm test
```

Tests use generated RSA keys and mocked Google endpoints. They do not need
Cloudflare credentials, a service-account key, or a live Firebase project.

After adding `wrangler.staging.jsonc`, deploy the staging code with:

```powershell
npx wrangler deploy --config wrangler.staging.jsonc
```

Then configure its secret and rate-limit namespace. Do not use the production
`wrangler.jsonc` for staging. Only after staging passes should production setup
and deployment be considered as a separate change. No secret value belongs in
the source tree.
