// The dish catalog's rules, shared by plan parsing and the one-time pass over saved plans:
// every item names its base dish and one category from this fixed list.

export const FOOD_CATEGORIES = [
  { id: 'fruit', examples: 'apple, kiwi' },
  { id: 'vegetables', examples: 'cucumber, bhindi, any sabzi, salads' },
  { id: 'dal_legumes', examples: 'dal, chole, lobhia, sprouts' },
  { id: 'grains_breads', examples: 'roti, daliya, paratha, poha, avocado toast' },
  { id: 'dairy_paneer', examples: 'curd, paneer, milk, buttermilk' },
  { id: 'eggs', examples: 'omelette, boiled eggs, bhurji' },
  { id: 'soy_tofu', examples: 'soya chunks, tofu' },
  { id: 'nuts_seeds', examples: 'soaked nuts, flax and pumpkin seeds, makhana' },
  { id: 'mixed_dishes', examples: 'Buddha bowl, bhel chaat, wraps' },
  { id: 'drinks_teas', examples: 'lemon water, jeera water, green tea, juices, coffee' },
  { id: 'open_choice', examples: 'favourite food, any dal, fav meal' },
] as const;

export const FOOD_CATEGORY_IDS = FOOD_CATEGORIES.map((c) => c.id);
export type FoodCategory = (typeof FOOD_CATEGORIES)[number]['id'];

/** Prompt rules for naming each item's base dish and category. */
export function dishRules(knownDishes: string[]): string {
  const categories = FOOD_CATEGORIES.map((c) => `${c.id} (${c.examples})`).join('; ');
  const known = knownDishes.length
    ? `Existing dishes: ${knownDishes.join('; ')}. When an item is one of these, use that exact name.`
    : 'No dishes exist yet.';
  return `For every item also give "dish": its base dish, short, in sentence case, without quantities, preparation notes or extras. Variants are the same dish: "avocado toast (multi grain bread)" and "Avocado toast with paneer" are both "Avocado toast"; "lemon ginger cinnamon ajwain tea" is "Lemon ginger tea"; "lukewarm jeera water (soaked overnight)" is "Jeera water". ${known}

And "category", exactly one of: ${categories}. Pick by the main ingredient; anything the plan leaves open, like "favourite food", is open_choice.`;
}
