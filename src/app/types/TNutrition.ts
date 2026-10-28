export type TMealType =
  | 'early_morning'
  | 'breakfast'
  | 'mid_morning'
  | 'lunch'
  | 'evening_snack'
  | 'dinner'
  | 'bedtime';

export type TMacros = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
};

export type TNutritionItem = TMacros & { name: string; quantity: string };

export type TNutritionMeal = TMacros & {
  id: string;
  day_id: string;
  meal_type: TMealType;
  label: string;
  time_window: string | null;
  position: number;
  items: TNutritionItem[];
  eaten_at: string | null;
};

export type TNutritionDay = TMacros & {
  id: string;
  plan_date: string;
  day_number: number | null;
  stated_calories: number | null;
  stated_protein_g: number | null;
  guidelines: string[];
  meals: TNutritionMeal[];
};

export type TWeekSeries = {
  dates: string[];
  labels: string[];
  planned: (number | null)[];
  eaten: (number | null)[];
  protein: (number | null)[];
  avgCalories: number | null;
  avgProtein: number | null;
};
