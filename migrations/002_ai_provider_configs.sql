create table if not exists ai_provider_configs (
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

create index if not exists idx_ai_provider_configs_user_id on ai_provider_configs(user_id);
create unique index if not exists idx_ai_provider_configs_one_active on ai_provider_configs(user_id) where active;
