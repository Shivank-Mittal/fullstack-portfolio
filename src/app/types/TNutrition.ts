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

export type TFoodCategory =
  | 'fruit'
  | 'vegetables'
  | 'dal_legumes'
  | 'grains_breads'
  | 'dairy_paneer'
  | 'eggs'
  | 'soy_tofu'
  | 'nuts_seeds'
  | 'mixed_dishes'
  | 'drinks_teas'
  | 'open_choice';

/** `dish` and `category` are set for plans saved after the dish catalog was added. */
export type TNutritionItem = TMacros & {
  name: string;
  quantity: string;
  dish?: string;
  category?: TFoodCategory;
};

/** One dish in the catalog, with how often and how recently it was planned. */
export type TDishStat = {
  name: string;
  category: TFoodCategory;
  days_planned: number;
  last_planned: string;
};

/** One time a dish appeared in a plan. */
export type TDishAppearance = {
  dish: string;
  category: TFoodCategory;
  plan_date: string;
  day_number: number | null;
  meal_type: TMealType;
  meal_label: string;
  eaten_at: string | null;
  item_name: string;
  quantity: string;
  calories: number;
  protein_g: number;
};

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
