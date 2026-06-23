-- Run this in the Supabase SQL Editor.

CREATE TABLE users (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id               TEXT UNIQUE NOT NULL,
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_status    TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW()
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_data" ON users
  FOR ALL USING (clerk_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "projects_own_data" ON projects
  FOR ALL USING (user_id = (
    SELECT id FROM users WHERE clerk_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));
