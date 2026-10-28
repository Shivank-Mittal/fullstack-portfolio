import { shiftDate, todayIso } from '../features/nutrition/nutrition.utils';
import { TMealType, TNutritionDay, TNutritionItem, TNutritionMeal } from '../types/TNutrition';

// Sample plans for dev builds when nobody is logged in: Days 24-53, the last one today,
// shaped like the nutritionist's Day 53 plan. Numbers are illustrative.

const item = (
  name: string,
  quantity: string,
  calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  fiber_g: number,
): TNutritionItem => ({ name, quantity, calories, protein_g, carbs_g, fat_g, fiber_g });

const MEALS: { type: TMealType; label: string; time: string | null; items: TNutritionItem[] }[] = [
  {
    type: 'early_morning',
    label: 'Morning',
    time: '6-7 AM',
    items: [item('Lemon water', '1 glass', 5, 0, 1, 0, 0)],
  },
  {
    type: 'breakfast',
    label: 'Breakfast',
    time: '7-8 AM',
    items: [
      item('Flax and pumpkin seeds', '1 tbsp', 60, 3, 2, 5, 2),
      item('Soaked nuts', '5-6 pieces', 90, 3, 3, 8, 1),
      item('Sprouts chaat', '1 bowl', 250, 15, 38, 3, 9),
      item('Apple', '1 medium', 120, 1, 31, 0, 5),
    ],
  },
  {
    type: 'lunch',
    label: 'Lunch',
    time: '1-2 PM',
    items: [
      item('Salad with hummus', '1 bowl', 120, 5, 12, 6, 5),
      item('Soya chunks sabzi', '1 bowl', 180, 18, 12, 6, 5),
      item('Seasonal veg', '1 bowl', 80, 3, 10, 3, 4),
      item('Roti', '1', 100, 3, 18, 1, 3),
    ],
  },
  {
    type: 'evening_snack',
    label: 'Evening snack',
    time: '5-6 PM',
    items: [item('Roasted makhana', '1 bowl', 110, 4, 20, 1, 2)],
  },
  {
    type: 'dinner',
    label: 'Dinner',
    time: '8 PM',
    items: [item('Dal paratha', '2 small', 345, 17, 45, 11, 6)],
  },
];

const GUIDELINES = [
  'Drink 3 litres of water through the day.',
  'Walk 10,000 steps.',
  'Coffee only before 4 PM, without sugar.',
];

function sum(items: TNutritionItem[]) {
  const total = (key: keyof TNutritionItem) => items.reduce((s, i) => s + (i[key] as number), 0);
  return {
    calories: total('calories'),
    protein_g: total('protein_g'),
    carbs_g: total('carbs_g'),
    fat_g: total('fat_g'),
    fiber_g: total('fiber_g'),
  };
}

function buildDay(dayNumber: number, plan_date: string, eatenMeals: number): TNutritionDay {
  const id = `mock-day-${dayNumber}`;
  const meals: TNutritionMeal[] = MEALS.map((m, position) => ({
    id: `${id}-meal-${position}`,
    day_id: id,
    meal_type: m.type,
    label: m.label,
    time_window: m.time,
    position,
    items: m.items,
    eaten_at: position < eatenMeals ? `${plan_date}T08:00:00Z` : null,
    ...sum(m.items),
  }));
  return {
    id,
    plan_date,
    day_number: dayNumber,
    stated_calories: 1450,
    stated_protein_g: 74,
    guidelines: GUIDELINES,
    meals,
    ...sum(meals.flatMap((m) => m.items)),
  };
}

const today = todayIso();

/** Enough sample days that the days box has to load more than one page. */
export const NUTRITION_MOCK_DAY_COUNT = 30;

/** Newest first, like `NutritionService.listDays`. Past days are fully eaten; today has two meals ticked. */
export const NUTRITION_MOCK_DAYS: TNutritionDay[] = Array.from(
  { length: NUTRITION_MOCK_DAY_COUNT },
  (_, back) => buildDay(53 - back, shiftDate(today, -back), back === 0 ? 2 : 5),
);
