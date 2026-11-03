import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ParsedDay, ParsedItem } from './plan.ts';
import { carryEaten } from './eaten.ts';

type Macros = Pick<ParsedItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'>;

function sum(rows: Macros[]): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const total = (key: keyof Macros) => rows.reduce((acc, row) => acc + row[key], 0);
  return {
    calories: Math.round(total('calories')),
    protein_g: r1(total('protein_g')),
    carbs_g: r1(total('carbs_g')),
    fat_g: r1(total('fat_g')),
    fiber_g: r1(total('fiber_g')),
  };
}

export async function saveDay(
  db: SupabaseClient,
  day: ParsedDay,
  rawText: string,
  messageId: number,
) {
  const meals = day.meals.map((meal, position) => ({
    meal_type: meal.meal_type,
    label: meal.label,
    time_window: meal.time_window,
    position,
    items: meal.items,
    ...sum(meal.items),
  }));
  const totals = sum(meals);

  // Read the old plan's ticks first so a re-sent plan doesn't wipe what was already eaten.
  const { data: oldDay, error: oldError } = await db
    .from('nutrition_days')
    .select('nutrition_meals(meal_type, eaten_at, position)')
    .eq('plan_date', day.plan_date)
    .maybeSingle();
  if (oldError) throw oldError;
  const oldMeals = [...(oldDay?.nutrition_meals ?? [])].sort((a, b) => a.position - b.position);
  const eatenAt = carryEaten(oldMeals, meals);

  // Re-sending a plan for the same date replaces it; meals go with it via ON DELETE CASCADE.
  const { error: deleteError } = await db
    .from('nutrition_days')
    .delete()
    .eq('plan_date', day.plan_date);
  if (deleteError) throw deleteError;

  const { data, error } = await db
    .from('nutrition_days')
    .insert({
      plan_date: day.plan_date,
      day_number: day.day_number,
      stated_calories: day.stated_calories,
      stated_protein_g: day.stated_protein_g,
      guidelines: day.guidelines,
      raw_text: rawText,
      telegram_message_id: messageId,
      ...totals,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: mealsError } = await db
    .from('nutrition_meals')
    .insert(meals.map((meal, i) => ({ ...meal, day_id: data.id, eaten_at: eatenAt[i] })));
  if (mealsError) throw mealsError;

  return { meals, totals };
}

export function summary(day: ParsedDay, saved: Awaited<ReturnType<typeof saveDay>>) {
  const { totals, meals } = saved;
  const date = new Date(`${day.plan_date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const lines = [
    `Saved ${day.day_number ? `Day ${day.day_number} · ` : ''}${date}`,
    `${totals.calories} kcal · P ${totals.protein_g}g · C ${totals.carbs_g}g · F ${totals.fat_g}g · Fiber ${totals.fiber_g}g`,
  ];
  if (day.stated_calories || day.stated_protein_g) {
    lines.push(
      `Plan says: ${day.stated_calories ?? '?'} kcal · ${day.stated_protein_g ?? '?'}g protein`,
    );
  }
  lines.push('');
  for (const meal of meals) {
    lines.push(`${meal.label}: ${meal.calories} kcal · P ${meal.protein_g}g`);
  }
  return lines.join('\n');
}
