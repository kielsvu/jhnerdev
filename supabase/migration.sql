-- ============================================================
-- jhner.dev contact + admin dashboard migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name   text NOT NULL,
  sender_email  text NOT NULL,
  subject       text NOT NULL,
  message       text NOT NULL,
  status        text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status     ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Trusted devices
CREATE TABLE IF NOT EXISTS trusted_devices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id              uuid NOT NULL,
  device_hash           text NOT NULL,
  label                 text,
  last_ip_address       text,
  last_seen             timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  expires_at            timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  UNIQUE(admin_id, device_hash)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_admin_id ON trusted_devices(admin_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires  ON trusted_devices(expires_at);

-- Verification challenges (PIN / MFA tokens stored as hash)
CREATE TABLE IF NOT EXISTS verification_challenges (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     uuid NOT NULL,
  type         text NOT NULL CHECK (type IN ('pin', 'email_otp')),
  otp_hash     text NOT NULL,
  expires_at   timestamptz NOT NULL,
  attempts     int NOT NULL DEFAULT 0,
  consumed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ver_challenges_admin ON verification_challenges(admin_id);

-- Admin sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          uuid NOT NULL,
  supabase_session  text,
  device_hash       text,
  ip_address        text,
  user_agent        text,
  last_active       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '8 hours'),
  revoked           boolean NOT NULL DEFAULT false,
  revoked_at        timestamptz,
  revoke_reason     text
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_active   ON admin_sessions(admin_id, revoked, expires_at);

-- Rate limit store (server-side, free-tier: Supabase DB)
CREATE TABLE IF NOT EXISTS rate_limit_store (
  key         text PRIMARY KEY,
  attempts    int NOT NULL DEFAULT 0,
  blocked_until timestamptz,
  block_reason  text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type  text NOT NULL,
  severity    text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  admin_id    uuid,
  ip_address  text,
  user_agent  text,
  description text NOT NULL,
  metadata    jsonb,
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_severity   ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_reviewed   ON security_events(reviewed_at) WHERE reviewed_at IS NULL;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE contact_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_store     ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events      ENABLE ROW LEVEL SECURITY;

-- Deny all anonymous/public access to every private table
CREATE POLICY "deny_public_contact_messages"      ON contact_messages          FOR ALL TO anon USING (false);
CREATE POLICY "deny_public_trusted_devices"       ON trusted_devices           FOR ALL TO anon USING (false);
CREATE POLICY "deny_public_ver_challenges"        ON verification_challenges   FOR ALL TO anon USING (false);
CREATE POLICY "deny_public_admin_sessions"        ON admin_sessions            FOR ALL TO anon USING (false);
CREATE POLICY "deny_public_rate_limit"            ON rate_limit_store          FOR ALL TO anon USING (false);
CREATE POLICY "deny_public_security_events"       ON security_events           FOR ALL TO anon USING (false);

-- Service role bypasses RLS by default (used by server-side admin.ts)
-- No service-role policies needed — it inherits superuser access

-- ============================================================
-- Auto-update updated_at on contact_messages
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Cleanup function (call periodically via pg_cron or manually)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM trusted_devices          WHERE expires_at < now();
  DELETE FROM verification_challenges  WHERE expires_at < now() AND consumed_at IS NULL;
  DELETE FROM admin_sessions           WHERE expires_at < now() OR revoked = true;
  DELETE FROM rate_limit_store         WHERE blocked_until < now() AND updated_at < now() - interval '1 hour';
END;
$$;
