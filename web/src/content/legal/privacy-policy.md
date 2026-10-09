# GmailSmith — Privacy Policy

**Last updated: 2026**

## The short version

GmailSmith runs entirely on your own computer. Your recipient lists, email
templates, attachments and campaign results never reach us or anyone else. We
have no server that stores your data, because there is no server.

## What stays on your computer

Everything the application knows about lives in a folder on your machine:

| Location | Contents |
| :--- | :--- |
| `%LOCALAPPDATA%\GmailSmith\campaigns.db` | Connected accounts, campaign history, per-recipient delivery results, opt-out list, your settings |
| `%LOCALAPPDATA%\GmailSmith\uploads\` | CSV files you import and attachments you upload |
| `%LOCALAPPDATA%\GmailSmith\credentials\` | Your own Google Cloud OAuth client file, if you use the OAuth connection method |
| `%LOCALAPPDATA%\GmailSmith\logs\` | A rotating diagnostic log |

On macOS this is `~/Library/Application Support/GmailSmith`; on Linux
`~/.local/share/gmailsmith`.

We never receive any of it. Uninstalling the application does not delete it, so
that a reinstall preserves your history.

## What leaves your computer, and when

The application makes exactly three kinds of outbound connection.

### 1. Sending your email

Messages are delivered either through the Gmail API or through
`smtp.gmail.com`, using credentials you supplied. The content of each message
goes to Google and to the recipient, exactly as it would if you sent it from
Gmail yourself. This is the entire point of the software.

### 2. Licence activation and validation

When you activate a licence key, the application sends that key and a randomly
generated installation identifier to the store you bought from (Lemon Squeezy
or Gumroad). It re-checks periodically. No personal data, recipient data or
message content is included.

If the store cannot be reached, the application keeps working for at least
14 days, so a network problem never locks you out.

### 3. Nothing else

There is no analytics, no telemetry, no crash reporting, no advertising
identifier, and no usage statistics. The application never contacts us
directly.

## Third-party services

| Service | Why | Their policy |
| :--- | :--- | :--- |
| Google (Gmail API / SMTP) | Deliver your email | Google Privacy Policy |
| Your chosen licence store | Validate your licence | Lemon Squeezy / Gumroad privacy policy |

We do not control those services and they process data under their own terms.

## Legal basis and your responsibilities

You use GmailSmith to email people. You are the data controller for that
processing; we are not a processor, because we never handle the data.

That means you are responsible for:

- having a lawful basis to contact each recipient;
- honouring opt-out requests (the application provides an opt-out list and an
  automatic notice to help);
- complying with the CAN-SPAM Act, the GDPR, PECR, or your local equivalents.

## Your rights

Because we hold no personal data about you or your recipients, there is nothing
for us to disclose, correct, export or erase. You have full control directly:

- **Access and export** — the History and Opt-outs tabs export everything as
  CSV, and the Settings tab produces a complete backup archive.
- **Erasure** — the Settings tab has a "Delete all local data" action that
  removes everything from your machine immediately.
- **Portability** — the backup archive is a plain zip of a SQLite database and
  your original files.

## Security

- Credentials are stored as JSON, not as executable pickles.
- The local server binds to `127.0.0.1` only and is not reachable from the
  network.
- The application requests the single Gmail scope `gmail.send`. It cannot read,
  modify or delete your mailbox contents, drafts or contacts.

Security issues should be reported to the address below rather than disclosed
publicly.

## Children

GmailSmith is business software and is not directed at children.

## Changes

If this policy changes materially, the updated version will be published at the
same URL with a new date.

## Contact

**Email:** support@gmailsmith.app
**Website:** https://gmailsmith.app
