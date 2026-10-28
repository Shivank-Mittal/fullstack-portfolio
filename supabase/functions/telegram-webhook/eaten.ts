type OldMeal = { meal_type: string; eaten_at: string | null };

// A re-sent plan replaces the day's meals; keep each tick on the meal of the same type,
// matching the nth meal of a type to the nth meal of that type in the old plan.
export function carryEaten(
  oldMeals: OldMeal[],
  newMeals: { meal_type: string }[],
): (string | null)[] {
  const seen = new Map<string, number>();
  return newMeals.map(({ meal_type }) => {
    const nth = seen.get(meal_type) ?? 0;
    seen.set(meal_type, nth + 1);
    const match = oldMeals.filter((m) => m.meal_type === meal_type)[nth];
    return match?.eaten_at ?? null;
  });
}
