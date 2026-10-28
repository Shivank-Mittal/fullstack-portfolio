create table public.nutrition_days (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null unique,
  day_number int,
  calories int not null,
  protein_g numeric(6, 1) not null,
  carbs_g numeric(6, 1) not null,
  fat_g numeric(6, 1) not null,
  fiber_g numeric(6, 1) not null,
  stated_calories int,
  stated_protein_g numeric(6, 1),
  guidelines text[] not null default '{}',
  raw_text text not null,
  telegram_message_id bigint,
  created_at timestamptz not null default now()
);

create table public.nutrition_meals (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.nutrition_days (id) on delete cascade,
  meal_type text not null check (
    meal_type in ('early_morning', 'breakfast', 'mid_morning', 'lunch', 'evening_snack', 'dinner', 'bedtime')
  ),
  label text not null,
  time_window text,
  position int not null,
  calories int not null,
  protein_g numeric(6, 1) not null,
  carbs_g numeric(6, 1) not null,
  fat_g numeric(6, 1) not null,
  fiber_g numeric(6, 1) not null,
  items jsonb not null default '[]'
);

create index nutrition_meals_day_id_idx on public.nutrition_meals (day_id, position);

alter table public.nutrition_days enable row level security;
alter table public.nutrition_meals enable row level security;

-- Writes come only from the telegram-webhook function using the service role, which bypasses RLS.
create policy "Owner reads nutrition days" on public.nutrition_days
  for select to authenticated
  using (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid);

create policy "Owner reads nutrition meals" on public.nutrition_meals
  for select to authenticated
  using (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid);
