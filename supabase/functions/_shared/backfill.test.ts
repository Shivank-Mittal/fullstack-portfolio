import { assertEquals } from 'jsr:@std/assert@1';
import { applyDishes, namesWithoutDish, type DishMapping } from './backfill.ts';

const meals = [
  {
    id: 'm1',
    items: [
      { name: 'Apple', quantity: '1', calories: 50 },
      { name: 'avocado toast (multi grain bread)', quantity: '1', calories: 200 },
    ],
  },
  {
    id: 'm2',
    items: [
      { name: 'apple ', quantity: '1 small apple', calories: 45 },
      {
        name: 'Lemon water',
        quantity: '1 glass',
        calories: 2,
        dish: 'Lemon water',
        category: 'drinks_teas',
      },
    ],
  },
];

Deno.test('lists each item name still missing a dish once, ignoring case and spaces', () => {
  assertEquals(namesWithoutDish(meals), ['apple', 'avocado toast (multi grain bread)']);
});

Deno.test('fills in dish and category by name and reports which meals changed', () => {
  const mapping: DishMapping[] = [
    { name: 'APPLE', dish: 'Apple', category: 'fruit' },
    { name: 'avocado toast (multi grain bread)', dish: 'Avocado toast', category: 'grains_breads' },
  ];
  const updated = applyDishes(meals, mapping);
  assertEquals(
    updated.map((m) => m.id),
    ['m1', 'm2'],
  );
  assertEquals(updated[0].items[1], {
    name: 'avocado toast (multi grain bread)',
    quantity: '1',
    calories: 200,
    dish: 'Avocado toast',
    category: 'grains_breads',
  });
  // An item that already had a dish keeps it.
  assertEquals(updated[1].items[1].dish, 'Lemon water');
  assertEquals(updated[1].items[0].dish, 'Apple');
});

Deno.test('meals with nothing to fill in are left out', () => {
  assertEquals(applyDishes(meals, []), []);
});
