// One-time pass over plans saved before the dish catalog existed: find items without a dish and
// fill in the dish and category the AI gave for that item name.

export interface StoredItem {
  name: string;
  dish?: string;
  category?: string;
  [key: string]: unknown;
}

export interface StoredMeal {
  id: string;
  items: StoredItem[];
}

export interface DishMapping {
  name: string;
  dish: string;
  category: string;
}

const key = (name: string) => name.trim().toLowerCase();

/** Item names (lower-cased, trimmed) that still have no dish, each once, in first-seen order. */
export function namesWithoutDish(meals: StoredMeal[]): string[] {
  const names = new Set<string>();
  for (const meal of meals) {
    for (const item of meal.items) if (!item.dish) names.add(key(item.name));
  }
  return [...names];
}

/** The meals whose items gained a dish from `mapping`, with their updated items. */
export function applyDishes(meals: StoredMeal[], mapping: DishMapping[]): StoredMeal[] {
  const byName = new Map(mapping.map((m) => [key(m.name), m]));
  const updated: StoredMeal[] = [];
  for (const meal of meals) {
    let changed = false;
    const items = meal.items.map((item) => {
      const found = item.dish ? undefined : byName.get(key(item.name));
      if (!found) return item;
      changed = true;
      return { ...item, dish: found.dish, category: found.category };
    });
    if (changed) updated.push({ id: meal.id, items });
  }
  return updated;
}
