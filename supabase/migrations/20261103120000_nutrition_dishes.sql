-- Dish catalog: every item in a plan names its base dish ("Avocado toast" for all its variants) and
-- a category from a fixed list. Each dish exists once here; items keep the name as written.

create table public.nutrition_dishes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (
    category in (
      'fruit', 'vegetables', 'dal_legumes', 'grains_breads', 'dairy_paneer', 'eggs',
      'soy_tofu', 'nuts_seeds', 'mixed_dishes', 'drinks_teas', 'open_choice'
    )
  ),
  created_at timestamptz not null default now()
);

create unique index nutrition_dishes_name_key on public.nutrition_dishes (lower(name));

alter table public.nutrition_dishes enable row level security;

create policy "Owner and viewers read dishes" on public.nutrition_dishes
  for select to authenticated
  using (public.can_view_nutrition());

-- One row per time a dish appears in a plan. security_invoker: the reader's own access rules on
-- days and meals apply, so viewers see exactly what they may see and strangers see nothing.
create view public.nutrition_dish_appearances
with (security_invoker = true) as
select
  dish.name as dish,
  dish.category,
  d.plan_date,
  d.day_number,
  m.meal_type,
  m.label as meal_label,
  m.eaten_at,
  item ->> 'name' as item_name,
  item ->> 'quantity' as quantity,
  (item ->> 'calories')::numeric as calories,
  (item ->> 'protein_g')::numeric as protein_g
from public.nutrition_meals m
join public.nutrition_days d on d.id = m.day_id
cross join lateral jsonb_array_elements(m.items) as item
join public.nutrition_dishes dish on lower(dish.name) = lower(item ->> 'dish');

-- One row per dish with how often and how recently it was planned.
create view public.nutrition_dish_stats
with (security_invoker = true) as
select
  dish as name,
  category,
  count(distinct plan_date)::int as days_planned,
  max(plan_date) as last_planned
from public.nutrition_dish_appearances
group by dish, category;

grant select on public.nutrition_dish_appearances, public.nutrition_dish_stats to authenticated;

-- Saving a day now also records any dish the plan introduces (first category wins).
create or replace function public.save_nutrition_day(p_day jsonb, p_meals jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (p_day ->> 'plan_date')::date;
  v_old jsonb;
  v_day_id uuid;
begin
  perform pg_advisory_xact_lock(hashtext('nutrition_day:' || v_date));

  insert into nutrition_dishes (name, category)
  select distinct on (lower(item ->> 'dish')) item ->> 'dish', item ->> 'category'
  from jsonb_array_elements(p_meals) meal
  cross join lateral jsonb_array_elements(meal -> 'items') item
  where coalesce(item ->> 'dish', '') <> ''
  on conflict ((lower(name))) do nothing;

  select coalesce(jsonb_agg(jsonb_build_object('meal_type', o.meal_type, 'nth', o.nth, 'eaten_at', o.eaten_at)), '[]')
    into v_old
  from (
    select m.meal_type, m.eaten_at,
           row_number() over (partition by m.meal_type order by m.position) as nth
    from nutrition_meals m
    join nutrition_days d on d.id = m.day_id
    where d.plan_date = v_date
  ) o;

  delete from nutrition_days where plan_date = v_date;

  insert into nutrition_days (
    plan_date, day_number, calories, protein_g, carbs_g, fat_g, fiber_g,
    stated_calories, stated_protein_g, guidelines, raw_text, telegram_message_id
  ) values (
    v_date,
    (p_day ->> 'day_number')::int,
    (p_day ->> 'calories')::int,
    (p_day ->> 'protein_g')::numeric,
    (p_day ->> 'carbs_g')::numeric,
    (p_day ->> 'fat_g')::numeric,
    (p_day ->> 'fiber_g')::numeric,
    (p_day ->> 'stated_calories')::int,
    (p_day ->> 'stated_protein_g')::numeric,
    coalesce(array(select jsonb_array_elements_text(p_day -> 'guidelines')), '{}'),
    p_day ->> 'raw_text',
    (p_day ->> 'telegram_message_id')::bigint
  )
  returning id into v_day_id;

  insert into nutrition_meals (
    day_id, meal_type, label, time_window, position,
    calories, protein_g, carbs_g, fat_g, fiber_g, items, eaten_at
  )
  select v_day_id, m.meal_type, m.label, m.time_window, m.position,
         m.calories, m.protein_g, m.carbs_g, m.fat_g, m.fiber_g, m.items,
         (select (o ->> 'eaten_at')::timestamptz
            from jsonb_array_elements(v_old) o
           where o ->> 'meal_type' = m.meal_type and (o ->> 'nth')::int = m.nth)
  from (
    select x.*, row_number() over (partition by x.meal_type order by x.position) as nth
    from jsonb_to_recordset(p_meals) as x(
      meal_type text, label text, time_window text, position int,
      calories int, protein_g numeric, carbs_g numeric, fat_g numeric, fiber_g numeric,
      items jsonb
    )
  ) m;

  return v_day_id;
end;
$$;
