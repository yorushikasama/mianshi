create extension if not exists pgcrypto;

create table "user" (
  id text primary key,
  name text not null,
  email text not null unique,
  username text unique,
  "displayUsername" text,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "session" (
  id text primary key,
  "userId" text not null references "user"(id) on delete cascade,
  token text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "account" (
  id text primary key,
  "userId" text not null references "user"(id) on delete cascade,
  "accountId" text not null,
  "providerId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table "verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table interview_targets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  direction text not null,
  role text not null,
  level text not null,
  deadline date,
  focus text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text not null,
  parse_status text not null default 'pending',
  extracted_areas text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table generated_question_sets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  target_id uuid references interview_targets(id) on delete set null,
  source_document_id uuid references source_documents(id) on delete set null,
  source_type text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  question_set_id uuid references generated_question_sets(id) on delete set null,
  title text not null,
  question_type text not null,
  difficulty text not null,
  tags text[] not null default '{}',
  source text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table answer_versions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_style text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text not null,
  duration_seconds integer not null default 0,
  self_rating text not null default 'unknown',
  created_at timestamptz not null default now()
);

create table ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  attempt_id uuid not null references practice_attempts(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  missing_points text[] not null default '{}',
  suggestions text[] not null default '{}',
  followups text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table review_states (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  mastery integer not null default 0 check (mastery between 0 and 100),
  due_at timestamptz,
  mistake_count integer not null default 0,
  unique (user_id, question_id)
);

create table ai_provider_configs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"(id) on delete cascade,
  name text not null,
  provider_format text not null,
  base_url text not null,
  model text not null,
  encrypted_api_key text not null,
  active boolean not null default false,
  last_tested_at timestamptz,
  last_test_status text not null default 'untested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_interview_targets_user_id on interview_targets(user_id);
create index idx_source_documents_user_id on source_documents(user_id);
create index idx_questions_user_id on questions(user_id);
create index idx_practice_attempts_user_id on practice_attempts(user_id);
create index idx_review_states_user_id_due_at on review_states(user_id, due_at);
create index idx_ai_provider_configs_user_id on ai_provider_configs(user_id);
create unique index idx_ai_provider_configs_one_active on ai_provider_configs(user_id) where active;
