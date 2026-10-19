# GmailSmith — Privacy Policy

**Last updated: October 19, 2026**

## The short version

GmailSmith is a Windows desktop app for sending personalised email campaigns.
Campaign lists, templates, history, and opt-out records are stored on your
computer. GmailSmith does not upload your full recipient list to its servers.
When you choose to send an email, the message and its recipient are sent to
Google through Gmail for delivery.

To sign in to GmailSmith, Google Firebase Authentication processes your account
identity. To connect Gmail for sending, GmailSmith requests the Gmail
send-only permission. This policy explains what is sent, where it is stored,
and how to request account deletion.

## Information and where it is stored

### GmailSmith account

When you create or use a GmailSmith account, the app sends your email address,
display name or username, and authentication information to Google Firebase
Authentication over HTTPS. Firebase manages the account, password
authentication (if used), email verification and reset messages, and
authentication records such as the sign-in provider and sign-in times.
GmailSmith does not store your password.

The app also stores a local sign-in session on your computer so you can stay
signed in. If you opt in to product-update emails during registration, the app
stores the consent choice and its timestamp locally. You can ask us to delete
your Firebase account by emailing support@gmailsmith.app.

### Website availability waitlist

If you submit the waitlist form at gmailsmith.app, we collect the email address
you provide, the time you asked to be notified, the consent-text version, and
an optional campaign source label from the link you used. The form requires you
to confirm: “Email me once when GmailSmith is available.” This is a request for
one availability email only. It does not subscribe you to a newsletter or
ongoing product marketing. We do not send a confirmation or other email when
you join.

The waitlist Worker stores this information in a Cloudflare D1 database. The
Worker does not store your IP address. Cloudflare may process ordinary network
information while providing website hosting, Turnstile bot protection, and
security. To rate-limit signups, the Worker also derives a SHA-256 digest from
the normalized email address; it does not save that digest in D1 or log it.
The form's Turnstile token is checked by Cloudflare before the address is
saved. If you ask us to remove your address before launch, email
support@gmailsmith.app; we will remove it from the waitlist database, any
email-delivery provider in use, and any temporary export still in our control.

If GmailSmith has not become publicly available, our daily cleanup is scheduled
to delete waitlist entries by the 12-month retention limit. When downloads
open, we may transfer the addresses
of people who asked for the notice to Resend (or another email-delivery
provider) to send that one availability email. We temporarily create a CSV
export for that transfer and delete it after the provider import is verified.
We delete the provider list and waitlist database entries within 30 days after
sending. We do not use this waitlist consent for newsletters, unrelated
promotions, or recurring marketing. A separate opt-in would be needed for those
messages.

### Gmail connection and Google user data

GmailSmith uses Google OAuth to connect the Gmail account you choose. It asks
for basic identity information to identify that account and requests the
sensitive Gmail scope gmail.send so it can send messages you prepare. The
Gmail permission is send-only: GmailSmith does not read your inbox, message
content, drafts, contacts, or other mailbox data.

OAuth tokens and the connected Gmail address are stored locally in the
GmailSmith app data database on your computer. The recipient and message
content you choose to send are sent to Google through the Gmail API (or, if
you choose the App Password connection, through Gmail SMTP) and then delivered
to the recipients. GmailSmith does not receive a copy of the delivered message
from Google.

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
| **Google Firebase Authentication** | If you choose Google sign-in for your separate GmailSmith account, the app sends the Google sign-in ID token to Firebase Authentication. Firebase processes the Google account email address and basic identity information to create or sign in to your GmailSmith account and returns the Firebase account identity and session tokens. This account sign-in is separate from connecting a Gmail sender. |
| **The email recipients you select** | Google delivers the message, including its subject, body, and attachments, to the addresses you chose. Those recipients and their email providers receive and process the message as part of delivery. GmailSmith does not choose recipients for you. |

The GmailSmith desktop app stores the connected sender address and OAuth
tokens on your computer. It does not upload Gmail mailbox data, sender tokens,
recipient lists, or message content to the GmailSmith website or to the
developer. Cloudflare (website hosting and the availability waitlist), Resend
(if used for the one-time availability notice), licence-validation providers,
and font or script providers do not receive Google user data from the app.
These services may receive the separate information described in this policy
for their own functions. If you choose to send information to support yourself,
only the information you include in that message is shared with support.

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
| %LOCALAPPDATA%\GmailSmith\campaigns.db | Connected sender account details and tokens, campaign history and row-level results, CSV email-column mappings, opt-out list, settings, and local sign-in session |
| %LOCALAPPDATA%\GmailSmith\uploads\ | CSV files you import and attachments you upload |
| %LOCALAPPDATA%\GmailSmith\credentials\ | Your own Google Cloud OAuth client file, if you use the OAuth connection method |
| %LOCALAPPDATA%\GmailSmith\logs\ | A rotating diagnostic log |

On macOS the app data directory is ~/Library/Application Support/GmailSmith;
on Linux it is ~/.local/share/gmailsmith. GmailSmith does not receive these
files. Uninstalling the app does not remove them.

The downloadable backup ZIP includes the SQLite database, uploaded CSVs and
attachments, and logs. Because the database contains stored Gmail sender
credentials/tokens and the Firebase sign-in refresh session, the ZIP contains
sensitive authentication data. Store it securely and do not assume it is
credential-free.

## Other network connections

The app makes network connections for these functions:

- **Account sign-in:** Google Firebase Authentication processes your account
  identity and authentication requests.
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
| Cloudflare, the website host, Turnstile provider, and D1 provider | Serve the public site, validate waitlist submissions, and store the one-time availability waitlist |
| Resend, if used for launch notice delivery | Import and deliver the one-time availability email to people who requested it |
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
- **GmailSmith account:** Email support@gmailsmith.app to request deletion of
  your Firebase Authentication account. Account deletion does not remove
  campaign files or local data from your computer; delete those separately in
  the app.
- **Google access:** You can review or revoke GmailSmith's Google access in
  your Google Account security settings. Revoking access prevents further
  Gmail API use until you reconnect.
- **Product updates:** The optional product-update checkbox is off by default.
  Its consent timestamp is stored locally. You may withdraw consent by
  contacting support@gmailsmith.app.
- **Availability waitlist:** You may ask us to remove your address at any time
  by emailing support@gmailsmith.app. Waitlist signup authorizes only one email
  announcing that public downloads are available; it does not authorize ongoing
  marketing.

We retain local data on your device until you delete it. Google retains
account and authentication information under its service terms and until the
Firebase account is deleted, subject to any legal retention requirements.

## Security

- Google and Firebase connections use HTTPS.
- Gmail and GmailSmith account tokens are stored in the app's local data
  directory on your device and are included in the downloadable backup. Keep
  your computer account and any backup archive secure.
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
