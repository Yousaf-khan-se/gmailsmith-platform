CREATE TABLE IF NOT EXISTS waitlist_signups (
  email_normalized TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  source TEXT,
  launch_notice_sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_waitlist_active_consent
  ON waitlist_signups (consented_at)
  WHERE launch_notice_sent_at IS NULL;
