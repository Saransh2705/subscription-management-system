create type public.app_role as enum ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER');

create table if not exists public.staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role public.app_role not null default 'VIEWER',
  is_active boolean not null default true,
  must_change_password boolean not null default true,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_users_set_updated_at on public.staff_users;
create trigger staff_users_set_updated_at
before update on public.staff_users
for each row
execute function public.set_updated_at();

alter table public.staff_users enable row level security;

create policy "staff select own profile"
on public.staff_users
for select
using (auth.uid() = id);

create policy "staff update own password flag"
on public.staff_users
for update
using (auth.uid() = id)
with check (auth.uid() = id);
