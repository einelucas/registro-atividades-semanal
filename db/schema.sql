-- Esquema para banco PostgreSQL/Neon; já aplicado ao projeto criado.
CREATE TABLE IF NOT EXISTS app_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 display_name varchar(120) NOT NULL,
 email varchar(250) UNIQUE,
 entra_oid varchar(100) UNIQUE,
 role varchar(20) NOT NULL DEFAULT 'COLLABORATOR' CHECK (role IN ('MANAGER','COLLABORATOR')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS units (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name varchar(120) NOT NULL UNIQUE,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name varchar(120) NOT NULL UNIQUE,
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES app_users(id),
 unit_id uuid NOT NULL REFERENCES units(id),
 category_id uuid NOT NULL REFERENCES categories(id),
 description varchar(300) NOT NULL CHECK(char_length(btrim(description)) BETWEEN 1 AND 300),
 status varchar(20) NOT NULL CHECK(status IN('DONE','IN_PROGRESS')),
 activity_date date NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activities_user_date_idx ON activities(user_id,activity_date DESC);
CREATE INDEX IF NOT EXISTS activities_date_idx ON activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS activities_unit_date_idx ON activities(unit_id,activity_date DESC);
INSERT INTO app_users(display_name,role)
 SELECT x.name,x.role FROM (VALUES
  ('Bianca','MANAGER'),('Ana','COLLABORATOR'),('Carlos','COLLABORATOR'),
  ('Fernanda','COLLABORATOR'),('Lucas','COLLABORATOR'),('Mariana','COLLABORATOR'),
  ('Pedro','COLLABORATOR'),('Camila','COLLABORATOR'),('Rafael','COLLABORATOR'),
  ('Juliana','COLLABORATOR')) AS x(name,role)
 WHERE NOT EXISTS(SELECT 1 FROM app_users u WHERE u.display_name=x.name AND u.email IS NULL);
INSERT INTO units(name) VALUES('Dourados'),('Sinop'),('Rondonópolis'),('Nova Mutum'),('Balsas'),('Outra unidade') ON CONFLICT(name) DO NOTHING;
INSERT INTO categories(name) VALUES
  ('PROJETO PADRONIZAÇÃO PREDIAL'),
  ('PROJETO PADRONIZAÇÃO MOBILIÁRIO / FACILITIES'),
  ('ESTUDO PRELIMINAR'),
  ('PROJETO / PROPOSTA DE MELHORIA'),
  ('FOLHA DE ESPECIFICAÇÃO TÉCNICA'),
  ('RELATÓRIOS E ANÁLISES'),
  ('ANÁLISES E APROVAÇÕES GREENDOCS'),
  ('ANÁLISE DE ESCOPO TÉCNICO'),
  ('ACOMPANHAMENTO DE CONTRATO'),
  ('SOLICITAÇÃO DE ORÇAMENTOS'),
  ('ABERTURA DE REQUISIÇÕES'),
  ('CADASTRO DE MATERIAIS'),
  ('ADEQUAÇÃO DE PDM E CORREÇÃO DE MATERIAIS'),
  ('APOIO TÉCNICO A FORNECEDORES'),
  ('CONTATO COM CLIENTE INTERNO'),
  ('APOIO TÉCNICO - EQUIPE DE OBRAS'),
  ('APOIO TÉCNICO - EQUIPE ENGENHARIA'),
  ('APOIO TÉCNICO - GERENTES ADM / MOBÍLIAS / FACILITIES'),
  ('APOIO TÉCNICO - SUPRIMENTOS'),
  ('APOIO TÉCNICO - MARKETING'),
  ('EQUALIZAÇÃO TÉCNICA'),
  ('PLANILHAS DE CONTROLE'),
  ('APROVAÇÃO DOCS SUPRIA'),
  ('ORIENTAÇÃO DIRECIONAMENTO COM PROJETISTAS'),
  ('ABERTURA DE DILAÇÃO CONTRATUAL'),
  ('ACOMPANHAMENTO DE CONTRATOS'),
  ('ACOMPANHAMENTO DE NOTAS E PAGAMENTOS'),
  ('LEVANTAMENTO TÉCNICO'),
  ('MEDIÇÃO DE OBRA E FISCALIZAÇÃO'),
  ('APROVAÇÕES REQUISIÇÕES CS'),
  ('ELABORAÇÃO DE APLICATIVOS DE CONTROLE GERENCIAL'),
  ('BRIEFING INICIAL PARA IMPLANTAÇÃO DE NOVO PROJETO'),
  ('VERIFICAÇÃO DE PENDÊNCIAS'),
  ('TREINAMENTOS E CURSOS'),
  ('PALESTRAS')
ON CONFLICT(name) DO NOTHING;

-- Autenticação local (para novas instalações)
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS password_hash text;
CREATE TABLE IF NOT EXISTS app_sessions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,token_hash char(64) NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS app_sessions_user_expires_idx ON app_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS auth_login_attempts(email varchar(250) PRIMARY KEY, attempts integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now(),blocked_until timestamptz);
