alter table public.nutrition_meals add column eaten_at timestamptz;

-- The browser may change eaten_at and nothing else.
revoke update on public.nutrition_meals from anon, authenticated;
grant update (eaten_at) on public.nutrition_meals to authenticated;

create policy "Owner marks meals eaten" on public.nutrition_meals
  for update to authenticated
  using (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid)
  with check (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid);
