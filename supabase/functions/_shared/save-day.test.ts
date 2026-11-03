import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { saveDay } from './save-day.ts';
import type { ParsedDay } from './plan.ts';

const item = (calories: number, protein_g: number) => ({
  name: 'x',
  quantity: '1',
  calories,
  protein_g,
  carbs_g: 1,
  fat_g: 1,
  fiber_g: 1,
});

const day: ParsedDay = {
  plan_date: '2026-10-30',
  day_number: 53,
  stated_calories: 1450,
  stated_protein_g: 74,
  guidelines: ['Walk'],
  meals: [
    {
      meal_type: 'breakfast',
      label: 'Breakfast',
      time_window: '7-8 AM',
      items: [item(120, 5.25), item(80, 2)],
    },
    { meal_type: 'dinner', label: 'Dinner', time_window: null, items: [item(300, 10)] },
  ],
};

function fakeDb(result: { data: unknown; error: unknown }) {
  const calls: [string, Record<string, unknown>][] = [];
  const db = {
    rpc: (fn: string, args: Record<string, unknown>) => {
      calls.push([fn, args]);
      return Promise.resolve(result);
    },
  } as unknown as SupabaseClient;
  return { db, calls };
}

Deno.test('saves the whole day in one database call with totals summed in code', async () => {
  const { db, calls } = fakeDb({ data: 'day-id', error: null });

  const saved = await saveDay(db, day, 'raw plan', 42);

  assertEquals(calls.length, 1);
  const [fn, args] = calls[0];
  assertEquals(fn, 'save_nutrition_day');
  assertEquals(args.p_day, {
    plan_date: '2026-10-30',
    day_number: 53,
    stated_calories: 1450,
    stated_protein_g: 74,
    guidelines: ['Walk'],
    raw_text: 'raw plan',
    telegram_message_id: 42,
    calories: 500,
    protein_g: 17.3,
    carbs_g: 3,
    fat_g: 3,
    fiber_g: 3,
  });
  const meals = args.p_meals as Record<string, unknown>[];
  assertEquals(
    meals.map((m) => [m.meal_type, m.position, m.calories, m.protein_g]),
    [
      ['breakfast', 0, 200, 7.3],
      ['dinner', 1, 300, 10],
    ],
  );
  assertEquals(saved.totals.calories, 500);
});

Deno.test('fails when the database rejects the save', async () => {
  const { db } = fakeDb({ data: null, error: new Error('lock timeout') });
  await assertRejects(() => saveDay(db, day, 'raw', 1), Error, 'lock timeout');
});
