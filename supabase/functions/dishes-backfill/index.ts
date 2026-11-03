import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'npm:zod@4.1.12';
import { completeJson } from '../_shared/ai.ts';
import { applyDishes, namesWithoutDish, type StoredMeal } from '../_shared/backfill.ts';
import { dishRules, FOOD_CATEGORY_IDS } from '../_shared/dishes.ts';

// One-time pass: gives the items of plans saved before the dish catalog a dish and category.
// Each call handles one batch of item names; call it again until "remaining" is 0. It only runs
// while the BACKFILL_TOKEN secret is set, and only for requests that send that token.

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const Mapping = z.strictObject({
  items: z.array(
    z.strictObject({
      name: z.string(),
      dish: z.string().min(1),
      category: z.enum(FOOD_CATEGORY_IDS as unknown as [string, ...string[]]),
    }),
  ),
});
const { $schema: _, ...schema } = z.toJSONSchema(Mapping) as Record<string, unknown>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

serve(async (req) => {
  const token = Deno.env.get('BACKFILL_TOKEN');
  if (!token || req.headers.get('x-backfill-token') !== token)
    return json(401, { error: 'unauthorized' });

  const batch = Number(new URL(req.url).searchParams.get('batch') ?? '40');
  const { data: meals, error } = await db.from('nutrition_meals').select('id, items');
  if (error) return json(500, { error: error.message });

  const pending = namesWithoutDish(meals as StoredMeal[]);
  if (pending.length === 0) return json(200, { mapped: 0, remaining: 0 });
  const names = pending.slice(0, batch);

  const { data: dishRows } = await db.from('nutrition_dishes').select('name');
  const known = (dishRows ?? []).map((d) => d.name as string);

  const raw = await completeJson({
    system: `You sort food items from Indian diet plans into a dish catalog. The user message is a JSON list of item names as written in plans. ${dishRules(known)}

Return one entry per input name, with "name" copied exactly as given. Respond with JSON only, matching this schema:
${JSON.stringify(schema)}`,
    user: JSON.stringify(names),
    schemaName: 'dish_mapping',
    schema,
  });
  const { items } = Mapping.parse(raw);

  // Record new dishes once each (case-insensitive); the first category given wins.
  const existing = new Set(known.map((n) => n.toLowerCase()));
  const newDishes = new Map<string, { name: string; category: string }>();
  for (const { dish, category } of items) {
    const k = dish.toLowerCase();
    if (!existing.has(k) && !newDishes.has(k)) newDishes.set(k, { name: dish, category });
  }
  if (newDishes.size) {
    const { error: insertError } = await db
      .from('nutrition_dishes')
      .insert([...newDishes.values()]);
    if (insertError) return json(500, { error: insertError.message });
  }

  // Items take the dish name as stored, so their spelling matches the catalog.
  const canonical = new Map(
    [...known, ...[...newDishes.values()].map((d) => d.name)].map((n) => [n.toLowerCase(), n]),
  );
  const mapping = items.map((i) => ({ ...i, dish: canonical.get(i.dish.toLowerCase()) ?? i.dish }));
  const updated = applyDishes(meals as StoredMeal[], mapping);
  for (const meal of updated) {
    const { error: updateError } = await db
      .from('nutrition_meals')
      .update({ items: meal.items })
      .eq('id', meal.id);
    if (updateError) return json(500, { error: updateError.message });
  }

  const remaining = namesWithoutDish(
    (meals as StoredMeal[]).map((m) => updated.find((u) => u.id === m.id) ?? m),
  ).length;
  return json(200, {
    mapped: items.length,
    newDishes: newDishes.size,
    updatedMeals: updated.length,
    remaining,
  });
});
