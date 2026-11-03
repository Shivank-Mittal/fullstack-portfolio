-- Replaces one day's plan in a single transaction, so plans processed in parallel can't clash.
-- A second save for the same date waits on the lock; ticks carry over to the meal of the same
-- type (first with first, second with second when a type repeats).
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

-- Only the worker (service role) saves plans.
revoke all on function public.save_nutrition_day(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_nutrition_day(jsonb, jsonb) to service_role;
