import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@1';
import { buildSystemPrompt, ParsedPlan } from './plan.ts';

const item = {
  name: 'avocado toast (multi grain bread)',
  quantity: '1',
  dish: 'Avocado toast',
  category: 'grains_breads',
  calories: 250,
  protein_g: 8,
  carbs_g: 30,
  fat_g: 12,
  fiber_g: 7,
};
const plan = (items: unknown[]) => ({
  days: [
    {
      plan_date: '2026-11-03',
      day_number: 57,
      stated_calories: null,
      stated_protein_g: null,
      guidelines: [],
      meals: [{ meal_type: 'breakfast', label: 'Breakfast', time_window: null, items }],
    },
  ],
});

Deno.test('every item carries its base dish and category', () => {
  assertEquals(ParsedPlan.parse(plan([item])).days[0].meals[0].items[0].dish, 'Avocado toast');
});

Deno.test('an item without a dish, or with an unknown category, is rejected', () => {
  const { dish: _dish, ...noDish } = item;
  assertThrows(() => ParsedPlan.parse(plan([noDish])));
  assertThrows(() => ParsedPlan.parse(plan([{ ...item, category: 'snacks' }])));
});

Deno.test('the prompt carries today and the existing dish names', () => {
  const prompt = buildSystemPrompt('2026-11-03', ['Avocado toast']);
  assertStringIncludes(prompt, 'use 2026-11-03');
  assertStringIncludes(prompt, 'Existing dishes: Avocado toast');
  assertStringIncludes(prompt, '"dish"');
});
