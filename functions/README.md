# functions/

Reserved for server-side glue that must run somewhere — currently empty.

**Future only (no provider selected; see `gmail-merge/docs/08` §8.3):**
If paid checkout is configured later, this directory may host a webhook that
links provider events to a GmailSmith account. No payment provider or webhook
is currently configured. The app can validate a licence key entered by a user
who already has one; this does not make purchases available.

Deliberately *not* home to any auth logic: authentication is
`gmail-merge/auth_client.py` + Google Firebase Authentication.
