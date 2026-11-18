-- Executada no Neon em 18/11/2026. NÃO reexecutar seed de administrador.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash text;
CREATE TABLE IF NOT EXISTS app_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, token_hash char(64) NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS app_sessions_user_expires_idx ON app_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS auth_login_attempts(email varchar(250) PRIMARY KEY,attempts integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now(),blocked_until timestamptz);
