import { inject, Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../store/auth/auth.store';
import { NUTRITION_MOCK_DAYS } from '../../mock/nutrition.mock';
import { TDishAppearance, TDishStat, TNutritionDay } from '../../types/TNutrition';

const DAY_SELECT = '*, meals:nutrition_meals(*)';

const withSortedMeals = (day: TNutritionDay): TNutritionDay => ({
  ...day,
  meals: [...(day.meals ?? [])].sort((a, b) => a.position - b.position),
});

// The sample days (newest first) flattened the way the database views flatten real plans.
function mockAppearances(days: TNutritionDay[]): TDishAppearance[] {
  return days.flatMap((day) =>
    day.meals.flatMap((meal) =>
      meal.items
        .filter((item) => item.dish && item.category)
        .map((item) => ({
          dish: item.dish!,
          category: item.category!,
          plan_date: day.plan_date,
          day_number: day.day_number,
          meal_type: meal.meal_type,
          meal_label: meal.label,
          eaten_at: meal.eaten_at,
          item_name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          protein_g: item.protein_g,
        })),
    ),
  );
}

function mockDishStats(days: TNutritionDay[]): TDishStat[] {
  const stats = new Map<string, TDishStat & { dates: Set<string> }>();
  for (const a of mockAppearances(days)) {
    const stat = stats.get(a.dish) ?? {
      name: a.dish,
      category: a.category,
      days_planned: 0,
      last_planned: a.plan_date,
      dates: new Set<string>(),
    };
    stat.dates.add(a.plan_date);
    stat.days_planned = stat.dates.size;
    if (a.plan_date > stat.last_planned) stat.last_planned = a.plan_date;
    stats.set(a.dish, stat);
  }
  return [...stats.values()]
    .map(({ dates: _dates, ...stat }) => stat)
    .sort((a, b) => b.days_planned - a.days_planned || a.name.localeCompare(b.name));
}

@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly db: SupabaseClient | null = inject(SUPERBASE_CLIENT);
  private readonly authStore = inject(AuthStore);
  private mockDays: TNutritionDay[] | null = null;

  /** Whether this login may see the plans: the owner, or an email on the viewers list. */
  async canView(): Promise<boolean> {
    if (this.useMock()) return true;
    if (!this.db) return false;
    const { data, error } = await this.db.rpc('can_view_nutrition');
    if (error) throw error;
    return data === true;
  }

  /** Dishes whose name contains `search` (any case), most planned first. */
  async listDishes(search: string): Promise<TDishStat[]> {
    const term = search.trim();
    if (this.useMock()) {
      return mockDishStats(this.mock()).filter((d) =>
        d.name.toLowerCase().includes(term.toLowerCase()),
      );
    }
    if (!this.db) return [];

    let query = this.db.from('nutrition_dish_stats').select('*');
    // % and _ are wildcards in ilike; escape them so they match literally.
    if (term) query = query.ilike('name', `%${term.replace(/[\\%_]/g, '\\$&')}%`);
    const { data, error } = await query.order('days_planned', { ascending: false });
    if (error) throw error;
    return (data ?? []) as TDishStat[];
  }

  /** Every time `dish` appeared in a plan, newest first. */
  async getDishAppearances(dish: string): Promise<TDishAppearance[]> {
    if (this.useMock()) {
      return mockAppearances(this.mock()).filter((a) => a.dish === dish);
    }
    if (!this.db) return [];

    const { data, error } = await this.db
      .from('nutrition_dish_appearances')
      .select('*')
      .eq('dish', dish)
      .order('plan_date', { ascending: false });
    if (error) throw error;
    return (data ?? []) as TDishAppearance[];
  }

  /** Only the owner ticks meals; viewers see the plans read-only. */
  canEdit(): boolean {
    return this.useMock() || this.authStore.isOwner();
  }

  async listDays(from?: string, to?: string): Promise<TNutritionDay[]> {
    if (this.useMock()) {
      return this.mock()
        .filter((d) => (!from || d.plan_date >= from) && (!to || d.plan_date <= to))
        .map((d) => structuredClone(d));
    }
    if (!this.db) return [];

    let query = this.db.from('nutrition_days').select(DAY_SELECT);
    if (from) query = query.gte('plan_date', from);
    if (to) query = query.lte('plan_date', to);
    const { data, error } = await query.order('plan_date', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as TNutritionDay[]).map(withSortedMeals);
  }

  /** One page of days older than `before` (or the newest days when null), newest first. */
  async listDaysBefore(before: string | null, limit: number): Promise<TNutritionDay[]> {
    if (this.useMock()) {
      return this.mock()
        .filter((d) => !before || d.plan_date < before)
        .slice(0, limit)
        .map((d) => structuredClone(d));
    }
    if (!this.db) return [];

    let query = this.db.from('nutrition_days').select(DAY_SELECT);
    if (before) query = query.lt('plan_date', before);
    const { data, error } = await query.order('plan_date', { ascending: false }).limit(limit);
    if (error) throw error;
    return ((data ?? []) as TNutritionDay[]).map(withSortedMeals);
  }

  async getDay(date: string): Promise<TNutritionDay | null> {
    if (this.useMock()) {
      const day = this.mock().find((d) => d.plan_date === date);
      return day ? structuredClone(day) : null;
    }
    if (!this.db) return null;

    const { data, error } = await this.db
      .from('nutrition_days')
      .select(DAY_SELECT)
      .eq('plan_date', date)
      .maybeSingle();
    if (error) throw error;
    return data ? withSortedMeals(data as TNutritionDay) : null;
  }

  async getNeighbours(date: string): Promise<{ prev: string | null; next: string | null }> {
    if (this.useMock()) {
      const dates = this.mock().map((d) => d.plan_date);
      return {
        prev: dates.find((d) => d < date) ?? null,
        next: [...dates].reverse().find((d) => d > date) ?? null,
      };
    }
    if (!this.db) return { prev: null, next: null };

    const nearest = async (op: 'lt' | 'gt') => {
      const { data, error } = await this.db!.from('nutrition_days')
        .select('plan_date')
        [op]('plan_date', date)
        .order('plan_date', { ascending: op === 'gt' })
        .limit(1);
      if (error) throw error;
      return (data?.[0]?.plan_date as string | undefined) ?? null;
    };
    const [prev, next] = await Promise.all([nearest('lt'), nearest('gt')]);
    return { prev, next };
  }

  /** Marks a meal eaten (or not) and returns the saved `eaten_at`. Throws if it could not be saved. */
  async setEaten(mealId: string, eaten: boolean): Promise<string | null> {
    const eatenAt = eaten ? new Date().toISOString() : null;
    if (this.useMock()) {
      const meal = this.mock()
        .flatMap((d) => d.meals)
        .find((m) => m.id === mealId);
      if (!meal) throw new Error(`Unknown meal ${mealId}`);
      meal.eaten_at = eatenAt;
      return eatenAt;
    }
    if (!this.db) throw new Error('Supabase is not available');

    const { data, error } = await this.db
      .from('nutrition_meals')
      .update({ eaten_at: eatenAt })
      .eq('id', mealId)
      .select('eaten_at')
      .single();
    if (error) throw error;
    return (data as { eaten_at: string | null }).eaten_at;
  }

  // Dev builds show sample plans to a logged-out visitor so the page can be tried without Google login.
  private useMock(): boolean {
    return !environment.production && !this.authStore.loggedIn();
  }

  private mock(): TNutritionDay[] {
    return (this.mockDays ??= structuredClone(NUTRITION_MOCK_DAYS));
  }
}
