alter table interview_targets add column if not exists stack text[] not null default '{}';
alter table interview_targets add column if not exists interview_date date;
alter table interview_targets add column if not exists is_current boolean not null default false;
alter table interview_targets add column if not exists updated_at timestamptz not null default now();

update interview_targets
set stack = focus
where stack = '{}' and focus <> '{}';

update interview_targets
set interview_date = deadline
where interview_date is null and deadline is not null;

with ranked as (
  select id, row_number() over (partition by user_id order by created_at desc, id desc) as row_number
  from interview_targets
)
update interview_targets target
set is_current = ranked.row_number = 1
from ranked
where target.id = ranked.id;

create unique index if not exists idx_interview_targets_one_current on interview_targets(user_id) where is_current;
