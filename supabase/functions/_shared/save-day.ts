import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ParsedDay, ParsedItem } from './plan.ts';

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

  // One transaction in the database (save_nutrition_day): replaces the day for this date, keeps
  // ticks on meals of the same type, and makes a parallel save for the same date wait its turn.
  const { error } = await db.rpc('save_nutrition_day', {
    p_day: {
      plan_date: day.plan_date,
      day_number: day.day_number,
      stated_calories: day.stated_calories,
      stated_protein_g: day.stated_protein_g,
      guidelines: day.guidelines,
      raw_text: rawText,
      telegram_message_id: messageId,
      ...totals,
    },
    p_meals: meals,
  });
  if (error) throw error;

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
