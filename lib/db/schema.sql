-- Run this in the Supabase SQL Editor.
--
-- Auth is simple username/password now (see lib/auth/), not Clerk — the
-- users table stores a bcrypt hash directly, no external id column.
-- Passwords are never stored in plaintext or logged.

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  data         JSONB NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- One row per (user, saved color/font/theme) — item_id references the
-- static data/ library's own id, not a DB row, since colors/fonts/themes
-- aren't stored in the database.
CREATE TABLE favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type  TEXT NOT NULL CHECK (item_type IN ('color', 'font', 'theme')),
  item_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX favorites_user_id_idx ON favorites (user_id);
CREATE INDEX projects_user_id_idx ON projects (user_id);

-- RLS is enabled for defense-in-depth, but every read/write in this app
-- goes through the server-only service-role client (getSupabaseAdmin() in
-- lib/db/supabase.ts), which bypasses RLS — ownership is enforced in API
-- route code (see app/api/projects/, app/api/favorites/), not by these
-- policies. There is no browser-side Supabase client carrying a user JWT
-- for these tables, so USING (false) — i.e. "nothing matches" — is
-- correct here: it blocks the anon/authenticated Postgres roles entirely
-- rather than encoding auth logic Postgres has no way to evaluate.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON users FOR ALL USING (false);
CREATE POLICY "service_role_only" ON projects FOR ALL USING (false);
CREATE POLICY "service_role_only" ON favorites FOR ALL USING (false);
