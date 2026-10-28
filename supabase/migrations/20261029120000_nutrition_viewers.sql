-- People the owner lets see the nutrition plans (read-only). Managed from the Supabase SQL
-- editor or dashboard; no browser access to the list itself.
create table public.nutrition_viewers (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table public.nutrition_viewers enable row level security;

-- True for the owner and for anyone whose Google login email is on the list.
create or replace function public.can_view_nutrition()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid
    or exists (
      select 1 from public.nutrition_viewers v
      where lower(v.email) = lower(auth.jwt() ->> 'email')
    );
$$;

revoke all on function public.can_view_nutrition() from public;
grant execute on function public.can_view_nutrition() to authenticated;

drop policy "Owner reads nutrition days" on public.nutrition_days;
drop policy "Owner reads nutrition meals" on public.nutrition_meals;

create policy "Owner and viewers read nutrition days" on public.nutrition_days
  for select to authenticated
  using (public.can_view_nutrition());

create policy "Owner and viewers read nutrition meals" on public.nutrition_meals
  for select to authenticated
  using (public.can_view_nutrition());

-- Ticking meals stays owner-only ("Owner marks meals eaten" is unchanged).
