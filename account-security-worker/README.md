# GmailSmith account-security Worker

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

## Required setup

1. Create a dedicated Google Cloud service account for this Worker. Grant it a
   custom role with only `firebaseauth.users.update` on the GmailSmith Firebase
   project. The Worker exchanges a short-lived service-account assertion for an
   OAuth token using the `identitytoolkit` scope, then calls the Identity
   Toolkit `accounts:update` method to set the user's `validSince` timestamp.
2. Store the service-account JSON as a Cloudflare Worker secret. From this
   directory, run:

   ```powershell
   npx wrangler secret put FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON
   ```

   Wrangler prompts for the value. Never put the JSON key in this repository,
   `wrangler.jsonc`, logs, or a desktop build. Rotate/delete the key if it is
   ever exposed.
3. Confirm that the `REVOCATION_RATE_LIMITER` namespace ID in `wrangler.jsonc`
   is unique within the Cloudflare account. The example configuration allows
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

Before deployment, configure the Worker secret and rate-limit namespace in the
Cloudflare account, then deploy with `npm run deploy`. No secret value belongs
in the source tree.
