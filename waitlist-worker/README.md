# GmailSmith waitlist Worker

This Worker implements the one-time availability waitlist endpoint at
`POST https://gmailsmith.app/api/waitlist`. It is separate from the Astro
static-site Worker and the R2 release Worker. There is no public endpoint for
listing or exporting addresses.

## Live status (2026-11-01)

The 1.0.2 public beta is live and intake is closed (`WAITLIST_OPEN=false`). The
site is in download mode and the Worker is deployed with the closed setting.
The previously consented list remains in D1 under the retention policy. It has
not been exported or sent to a provider; no campaign-provider account is
configured. The one-time notice below is future work, not a completed send.

## One-time Cloudflare setup

From this directory:

1. Create the D1 database:

   ```powershell
   npx wrangler d1 create gmailsmith-waitlist
   ```

2. Copy the returned database UUID into `wrangler.jsonc`, replacing the all-zero
   placeholder. Keep the database name `gmailsmith-waitlist`.
3. Apply the migration:

   ```powershell
   npm run db:migrate:remote
   ```

4. In Cloudflare Turnstile, create a Managed widget restricted to
   `gmailsmith.app`. Set its public site key as the `PUBLIC_TURNSTILE_SITE_KEY`
   build environment variable for the static-site Worker. Add the matching
   secret to this Worker:

   ```powershell
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

5. Deploy this waitlist Worker from this directory:

   ```powershell
   npm run deploy
   ```

6. Publish the Astro site separately through the configured Cloudflare
   Workers Builds project. Its repository root is `web/`; the build command is
   `npm run build` and deployment uses the committed `web/wrangler.jsonc`
   configuration. The waitlist Worker's `npm run deploy` does not publish the
   static site.

The route is limited to `/api/waitlist*`; the existing static site and release
routes are unchanged. Set the same consent version (`v1`) in this Worker and
`web/src/site.ts` when changing the checkbox copy. `ALLOWED_ORIGIN` must remain
`https://gmailsmith.app`. The Worker rate-limits each normalized email to five
submissions per minute using an ephemeral SHA-256 key; it does not write the
key or IP address to D1. The rate-limit namespace ID in `wrangler.jsonc` must
be unique within your Cloudflare account.

The scheduled daily Worker cleanup uses a one-day buffer before the 12-month
cutoff for entries without a launch notice, so a successful daily run deletes
them by the 12-month maximum. It deletes notified entries after 29 days. The
Worker stores email, consent timestamp/version, and an optional sanitized
`utm_source`; it sends no signup emails.

For progress measurement, use Cloudflare's aggregate request totals as a coarse
site-traffic trend and the D1 signup count/source breakdown for waitlist
conversion. No additional page-view tracker or marketing pixel is installed.

## One-time launch notice (intake already closed)

Intake is already closed and the site is in download mode. Do not export the
final recipient list until an email provider is configured and the send is
ready to proceed. A bulk update of rows without a send timestamp is safe only
after intake is closed and the final recipient snapshot has been taken.

Before sending, confirm the installer, release manifest, onboarding, Gmail
authorization flow, and Google approval remain valid. The first two cutover
steps below are complete; keep them as recovery instructions if intake is ever
reopened:

1. **Complete:** `WAITLIST_OPEN=false` is deployed. This freezes new signups in D1.
2. **Complete:** `availability: 'download'` is published; the manifest-driven
   download CTA is live and the waitlist form is removed.
3. When ready, export the frozen active list using the command below. Import it into the
   email provider's audience and confirm the imported recipient count. The
   provider audience becomes the send source; securely delete the local CSV
   after verifying the import.
4. Before sending, process every removal request in D1 and the provider
   audience. If a staged CSV still exists, remove the address there too; if you
   cannot confirm all copies match, discard the CSV and re-export after the D1
   deletion. Do not send from a stale file.
5. Send the one availability notice using the provider's broadcast or campaign
   tool, with its unsubscribe/removal route. Disable open/click tracking. If
   the provider reports a partial send, use its recipient report to send only
   to recipients it confirms were not already sent the notice. Never resend to
   recipients already sent the message. A permanent bounce counts as an
   attempted notice; do not use the address for another campaign.
6. Once the provider confirms the broadcast and any unsent-recipient catch-up
   are complete, record the completion time in D1. `launch_notice_sent_at`
   means the one-time notice was submitted to the provider, not that delivery
   to an inbox is guaranteed. Intake is closed, so this update applies only to
   the frozen active list:

   ```powershell
   npx wrangler d1 execute gmailsmith-waitlist --remote --command "UPDATE waitlist_signups SET launch_notice_sent_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE launch_notice_sent_at IS NULL AND julianday(consented_at) > julianday('now', '-12 months')"
   ```

7. Delete the provider audience and any retained local export as soon as
   practical, and no later than 30 days after the notice. The daily Worker
   cleanup deletes notified D1 rows after 29 days, leaving time for the daily
   run to meet the 30-day maximum. Honor removal requests earlier by deleting
   the address from D1, the provider audience, and any remaining local copy.

## Export command

Use an authenticated Wrangler session only after signup is closed and the site
has switched to download mode. Run this from the platform repository root in
PowerShell. The output contains personal data; the default
`waitlist-export.csv` path is ignored by Git, but still store it securely until
the provider import has been verified, then delete it:

```powershell
Push-Location .\waitlist-worker
$query = "SELECT email, consented_at, source, launch_notice_sent_at FROM waitlist_signups WHERE launch_notice_sent_at IS NULL AND julianday(consented_at) > julianday('now', '-12 months') ORDER BY consented_at"
npx wrangler d1 execute gmailsmith-waitlist --remote --command $query --json |
  python .\scripts\export_waitlist.py ..\waitlist-export.csv
Pop-Location
```

Import only that CSV into the email provider used for the one-time availability
notice using `launch-notice-template.md`. The CSV must not be the send source
after import; send from the provider audience so removal requests can be
applied there. Normalize the address before running this example:

```powershell
npx wrangler d1 execute gmailsmith-waitlist --remote --command "DELETE FROM waitlist_signups WHERE email_normalized = lower('person@example.com')"
```

## Local checks

```powershell
npm test
python -m unittest discover -s test -p "test_*.py"
```
