# GmailSmith — Privacy Policy

**Last updated: November 1, 2026**

## The short version

GmailSmith is a Windows desktop app for sending personalised email campaigns.
Campaign lists, templates, history, and opt-out records are stored on your
computer. GmailSmith does not upload your full recipient list to its servers.
When you choose to send an email, the message and its recipient are sent to
Google through Gmail for delivery.

To sign in to GmailSmith, Google Firebase Authentication processes your account
identity. To connect Gmail for sending, GmailSmith requests the Gmail
send-only permission. This policy explains what is sent, where it is stored,
and how to delete your GmailSmith account and this computer's local data.

## Information and where it is stored

### GmailSmith account

When you create or use a GmailSmith account, the app sends your email address,
display name or username, and authentication information to Google Firebase
Authentication over HTTPS. Firebase manages the account, password
authentication (if used), email verification and reset messages, and
authentication records such as linked sign-in methods and sign-in times.
GmailSmith does not store your password.

The app also stores a local sign-in session on your computer so you can stay
signed in. On Windows, the session tokens are protected with current-user
Windows DPAPI before they are stored in the app database. Credential storage is
currently supported on Windows; macOS and Linux builds do not persist
credentials or send email. The current app does not offer product-update
consent or send product-update emails. Use **Settings → Delete GmailSmith
account** to delete your Firebase account after reauthentication. Your local
campaigns, CSVs, senders and history remain on this computer and are available
after another account signs in here.

### Website availability waitlist

While it was open, the waitlist form at gmailsmith.app collected the email
address provided, the time of the request, the consent-text version, and an
optional campaign source label from the link used. The form required this
confirmation: “Email me once when GmailSmith is available.” That consent is for
one availability email only, not a newsletter or ongoing product marketing.
We did not send a confirmation email when someone joined. The public download
is now available and waitlist intake is closed. As of November 1, 2026, the
consented addresses have not been exported or sent a notice; they remain in D1
under the retention terms below.

The waitlist Worker stores this information in a Cloudflare D1 database. The
Worker does not store your IP address. Cloudflare may process ordinary network
information while providing website hosting, Turnstile bot protection, and
security. To rate-limit signups, the Worker also derives a SHA-256 digest from
the normalized email address; it does not save that digest in D1 or log it.
The form's Turnstile token was checked by Cloudflare before the address was
saved. You may ask us to remove your address at any time by emailing
support@gmailsmith.app; we will remove it from D1 and any provider list or
temporary export that exists.

Entries without a recorded notice are deleted after 12 months through the
Worker's daily cleanup. If the one-time notice is later sent, we may transfer
the addresses of people who requested it to an email-delivery provider. No
provider is currently configured and no export has been made. Any temporary
CSV will be deleted after the provider import is verified; the provider list
and corresponding D1 records will be deleted within 30 days after sending.
This consent is not used for newsletters, unrelated promotions, or recurring
marketing. A separate opt-in would be needed for those messages.

### Gmail connection and Google user data

GmailSmith uses Google OAuth to connect the Gmail account you choose. It asks
for basic identity information to identify that account and requests the
sensitive Gmail scope gmail.send so it can send messages you prepare. The
Gmail permission is send-only: GmailSmith does not read your inbox, message
content, drafts, contacts, or other mailbox data.

OAuth tokens, SMTP App Passwords, and the connected Gmail address are stored
locally in the GmailSmith app data database on your computer. On Windows, OAuth
tokens and App Passwords are protected with current-user DPAPI before being
written to SQLite. The recipient and message content you choose to send are
sent to Google through the Gmail API (or, if you choose the App Password
connection, through Gmail SMTP) and then delivered to the recipients.
GmailSmith does not receive a copy of the delivered message from Google.

GmailSmith uses Google user data only to provide the sign-in and email-sending
features described here. It does not sell Google user data, use it for
advertising, or use it to train general-purpose AI or machine-learning models.
The use of information received from Google Workspace scopes adheres to the
[Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy),
including its Limited Use requirements.

#### Who receives Google user data

For the app features you choose to use, GmailSmith shares Google user data only
with the parties listed here:

| Recipient | Google user data shared and purpose |
| :--- | :--- |
| **Google LLC — Google OAuth and Gmail services** | Google OAuth receives the authorization code to exchange it for tokens and receives the refresh token when GmailSmith refreshes access. Google returns the tokens to the app, where they are stored on your computer. GmailSmith uses Google's OpenID Connect user-info service to identify the connected sender address. If you choose Gmail SMTP, Google's SMTP service receives your sender address and Gmail App Password for authentication. When you send a campaign or test message, Gmail API or Gmail SMTP receives the recipient address, subject, message body, and any attachments you selected so Google can deliver that message. |
| **Google Firebase Authentication** | For Google sign-in, the app sends the Google sign-in ID token to Firebase Authentication. Firebase processes the account email, display name and linked sign-in methods and returns the Firebase account identity and session tokens. When you delete your GmailSmith account, the app sends a freshly authenticated Firebase ID token to Firebase to delete that identity. This account sign-in is separate from connecting a Gmail sender. |
| **The email recipients you select** | Google delivers the message, including its subject, body, and attachments, to the addresses you chose. Those recipients and their email providers receive and process the message as part of delivery. GmailSmith does not choose recipients for you. |

The GmailSmith desktop app stores the connected sender address and OAuth
tokens on your computer. The app does not upload Gmail mailbox data, sender
tokens, recipient lists, or message content to the GmailSmith website or the
developer. Cloudflare website hosting, the waitlist, an email provider if
configured for the one-time availability notice, licence-validation providers,
and font or script providers do not receive Gmail sender data from the app.

Account deletion sends a freshly authenticated Firebase ID token to Firebase;
it does not send local campaigns or sender credentials. These services may
receive the separate information described in this policy for their own
functions. If you choose to send information to support yourself, only the
information you include in that message is shared with support.

Apart from the feature-specific sharing described above and information you
choose to send directly to support, GmailSmith does not transfer or disclose
Google user data to third parties, except when disclosure is required by law
or necessary to protect security. We do not sell Google user data, use it for
advertising or analytics, or use it to train generalized AI or machine-learning
models.

### Campaign and device data

These items are stored locally on your computer:

| Location | Contents |
| :--- | :--- |
| %LOCALAPPDATA%\GmailSmith\campaigns.db | Device-wide connected sender details, campaign history and row-level results, CSV email-column mappings, opt-out list, settings, and current local sign-in session. Sender connections and campaign data are not assigned to a Firebase account; they remain available when you switch accounts. On Windows, Gmail sender credentials, Firebase session tokens and licence keys use DPAPI-protected envelopes. |
| %LOCALAPPDATA%\GmailSmith\uploads\ | CSV files you import and attachments you upload |
| %LOCALAPPDATA%\GmailSmith\credentials\ | Your own Google Cloud OAuth client file, if you use the OAuth connection method |
| %LOCALAPPDATA%\GmailSmith\logs\ | A rotating diagnostic log |

On macOS the app data directory is ~/Library/Application Support/GmailSmith;
on Linux it is ~/.local/share/gmailsmith. GmailSmith does not receive these
files. Uninstalling the app does not remove them.

The current downloadable backup ZIP includes campaign history, recipient
results, opt-out records, uploaded CSVs, attachments, and logs. It excludes
connected sender credentials, Firebase sign-in sessions, and licence keys.
After restoring, sign in again, reconnect sender accounts, and re-enter the
licence key. Backups created by older versions may contain plaintext
credentials. If an older archive was lost or shared, revoke exposed Gmail OAuth
access in Google Account connections, remove any exposed Gmail App Password,
and reset your GmailSmith password or delete the GmailSmith account from
Settings. Account deletion does not erase local campaigns and sender data.
Contact support if a licence key may have been exposed. Treat all old archives
as sensitive and delete any copies you control.

## Other network connections

The app makes network connections for these functions:

- **Account sign-in:** Google Firebase Authentication processes your account
  identity and authentication requests.
- **Account deletion:** after reauthentication, the app sends a fresh Firebase
  ID token to Firebase over HTTPS to delete the current Firebase account. The
  app then signs out this device. Device-local campaigns, sender connections,
  CSVs, attachments and history remain on this computer.
- **Sending email:** Google Gmail API or Gmail SMTP receives the messages you
  choose to send and delivers them to your recipients.
- **Release checks:** GmailSmith checks the public release manifest at
  gmailsmith.app. The website host may receive ordinary connection information
  such as your IP address, request time, and browser or app request headers.
- **Licence validation:** If you activate a licence key, the app sends that key
  and a random installation identifier to the licence provider associated with
  that key. The provider returns the licence status. The app does not send
  recipient lists or message content for licence validation.
- **Interface resources:** The app may request fonts and a Socket.IO client
  library from their public providers to display and operate the interface.
  Those providers may receive ordinary network connection information.

The app does not include advertising, analytics, or crash-reporting services.

## Third-party services

| Service | Why it is used |
| :--- | :--- |
| Google Firebase Authentication | GmailSmith account registration and sign-in |
| Google (OAuth and Gmail API/SMTP) | Identify the selected Google account and deliver the emails you send |
| Cloudflare, website host, Turnstile provider and D1 provider | Serve the public site and validate/store the one-time availability waitlist. They do not receive Gmail sender credentials, recipient lists or message content from the desktop app. |
| Email campaign provider, if configured | Import and deliver the one-time availability email to people who requested it; none is configured as of November 1, 2026 |
| Licence provider, if you activate a key | Validate the key and its plan status |
| Public font and script providers | Load interface resources |

These providers process information under their own terms and privacy
policies. GmailSmith does not control their independent processing.

## Your responsibilities and choices

You choose the recipients and content of each campaign. You are responsible
for having the right to contact recipients, honoring opt-out requests, and
following email and privacy laws that apply to you.

GmailSmith does not monitor your Gmail inbox or process replies. If a recipient
asks to opt out by replying, you must review that message and manually add the
address to the app's Opt-outs list before sending to that person again. The
optional footer is a notice only; it does not verify consent or replace your
legal responsibilities.

- **Local data:** Use the app's Settings option to delete local app data. You
  can export campaign history and opt-outs from the app before deleting them.
- **GmailSmith account:** Use **Settings → Delete GmailSmith account** and
  reauthenticate. This deletes the Firebase identity and its linked sign-in
  methods. Local campaigns, CSVs, sender connections, attachments and history
  remain on this computer; use **Delete all local data** separately if you
  also want to erase them.
- **Google access:** You can review or revoke GmailSmith's Google access in
  your Google Account security settings. Revoking access prevents further
  Gmail API use until you reconnect.
- **Product updates:** The current app does not collect product-update
  consent or send product-update emails.
- **Availability waitlist:** You may ask us to remove your address at any time
  by emailing support@gmailsmith.app. Waitlist signup authorizes only one email
  announcing that public downloads are available; it does not authorize ongoing
  marketing.

We retain local data on your device until you delete it. Google retains
account and authentication information under its service terms and until the
Firebase account is deleted, subject to any legal retention requirements.

## Security

- Google and Firebase connections use HTTPS.
- On Windows, Gmail OAuth tokens, SMTP App Passwords, Firebase sessions and
  licence keys are protected with current-user DPAPI before SQLite storage.
  This ties them to the Windows profile but cannot protect them from malicious
  software already running as your Windows user. Credential storage and
  sending fail closed on macOS and Linux until native backends are available.
- Current backups exclude credentials. Older backups may contain plaintext
  secrets; revoke or replace exposed credentials as described above.
- The local app server binds to 127.0.0.1 and is not reachable from your
  network.

Security issues should be reported to support@gmailsmith.app.

## Children

GmailSmith is business software and is not directed at children.

## Changes

If this policy changes materially, the updated version will be published at
this URL with a new date.

## Contact

GmailSmith is developed and operated by an individual developer based in
Lahore, Punjab, Pakistan; it is not a registered company.

**Email:** support@gmailsmith.app

**Website:** https://gmailsmith.app
