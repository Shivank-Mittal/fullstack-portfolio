import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { dishRules, FOOD_CATEGORY_IDS } from './dishes.ts';

Deno.test('offers exactly the agreed categories', () => {
  assertEquals(FOOD_CATEGORY_IDS, [
    'fruit',
    'vegetables',
    'dal_legumes',
    'grains_breads',
    'dairy_paneer',
    'eggs',
    'soy_tofu',
    'nuts_seeds',
    'mixed_dishes',
    'drinks_teas',
    'open_choice',
  ]);
});

Deno.test('the rules name every category and ask for the base dish', () => {
  const rules = dishRules([]);
  for (const id of FOOD_CATEGORY_IDS) assertStringIncludes(rules, id);
  assertStringIncludes(rules, 'Avocado toast');
  assertStringIncludes(rules, 'No dishes exist yet');
});

Deno.test('the rules list the dishes that already exist so names are reused', () => {
  const rules = dishRules(['Avocado toast', 'Lemon ginger tea']);
  assertStringIncludes(rules, 'Existing dishes: Avocado toast; Lemon ginger tea');
});
