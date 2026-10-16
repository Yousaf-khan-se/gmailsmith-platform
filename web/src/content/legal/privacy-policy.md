# GmailSmith — Privacy Policy

**Last updated: October 16, 2026**

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

### Campaign and device data

These items are stored locally on your computer:

| Location | Contents |
| :--- | :--- |
| %LOCALAPPDATA%\GmailSmith\campaigns.db | Connected account details and tokens, campaign history, per-recipient delivery results, opt-out list, settings, and local sign-in session |
| %LOCALAPPDATA%\GmailSmith\uploads\ | CSV files you import and attachments you upload |
| %LOCALAPPDATA%\GmailSmith\credentials\ | Your own Google Cloud OAuth client file, if you use the OAuth connection method |
| %LOCALAPPDATA%\GmailSmith\logs\ | A rotating diagnostic log |

On macOS the app data directory is ~/Library/Application Support/GmailSmith;
on Linux it is ~/.local/share/gmailsmith. GmailSmith does not receive these
files. Uninstalling the app does not remove them.

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
| Cloudflare, the website host | Serve the public site, release manifest, and downloads |
| Licence provider, if you activate a key | Validate the key and its plan status |
| Public font and script providers | Load interface resources |

These providers process information under their own terms and privacy
policies. GmailSmith does not control their independent processing.

## Your responsibilities and choices

You choose the recipients and content of each campaign. You are responsible
for having the right to contact recipients, honoring opt-out requests, and
following email and privacy laws that apply to you.

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

We retain local data on your device until you delete it. Google retains
account and authentication information under its service terms and until the
Firebase account is deleted, subject to any legal retention requirements.

## Security

- Google and Firebase connections use HTTPS.
- Gmail and GmailSmith account tokens are stored in the app's local data
  directory on your device. Keep your computer account secure.
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
