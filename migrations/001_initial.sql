create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table verification_tokens (
  identifier text not null,
  token text not null,
  expires_at timestamptz not null,
  primary key (identifier, token)
);

create table interview_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  direction text not null,
  role text not null,
  level text not null,
  deadline date,
  focus text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  document_type text not null,
  storage_path text not null,
  parse_status text not null default 'pending',
  extracted_areas text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table generated_question_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  target_id uuid references interview_targets(id) on delete set null,
  source_document_id uuid references source_documents(id) on delete set null,
  source_type text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
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
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_style text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text not null,
  duration_seconds integer not null default 0,
  self_rating text not null default 'unknown',
  created_at timestamptz not null default now()
);

create table ai_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  attempt_id uuid not null references practice_attempts(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  missing_points text[] not null default '{}',
  suggestions text[] not null default '{}',
  followups text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table review_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  mastery integer not null default 0 check (mastery between 0 and 100),
  due_at timestamptz,
  mistake_count integer not null default 0,
  unique (user_id, question_id)
);

create index idx_interview_targets_user_id on interview_targets(user_id);
create index idx_source_documents_user_id on source_documents(user_id);
create index idx_questions_user_id on questions(user_id);
create index idx_practice_attempts_user_id on practice_attempts(user_id);
create index idx_review_states_user_id_due_at on review_states(user_id, due_at);
