import { TNutritionDay, TNutritionMeal, TWeekSeries } from '../../types/TNutrition';

// Plan dates are calendar days ('YYYY-MM-DD'). Everything here works in UTC so a date never
// shifts by one when the browser sits in another time zone.
const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const toUtc = (date: string) => new Date(`${date}T00:00:00Z`);
const toIso = (d: Date) => d.toISOString().slice(0, 10);
const format = (date: string, options: Intl.DateTimeFormatOptions) =>
  toUtc(date).toLocaleDateString('en-GB', { timeZone: 'UTC', ...options });

export function shiftDate(date: string, days: number): string {
  return toIso(new Date(toUtc(date).getTime() + days * DAY_MS));
}

export function weekStart(date: string): string {
  const mondayOffset = (toUtc(date).getUTCDay() + 6) % 7;
  return shiftDate(date, -mondayOffset);
}

export function weekDates(date: string): string[] {
  const start = weekStart(date);
  return WEEKDAY_LABELS.map((_, i) => shiftDate(start, i));
}

export function monthCells(month: string): (string | null)[] {
  const first = `${month}-01`;
  const lead = (toUtc(first).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = first; d.startsWith(month); d = shiftDate(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function formatShortDate(date: string): string {
  return format(date, { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '');
}

export function dayHeadline(day: Pick<TNutritionDay, 'plan_date' | 'day_number'>): string {
  const weekday = format(day.plan_date, { weekday: 'long' });
  return day.day_number ? `Day ${day.day_number} · ${weekday} plan` : `${weekday} plan`;
}

export function eatenCalories(meals: Pick<TNutritionMeal, 'calories' | 'eaten_at'>[]): number {
  return meals.reduce((sum, m) => sum + (m.eaten_at ? m.calories : 0), 0);
}

export function eatenCount(meals: Pick<TNutritionMeal, 'eaten_at'>[]): number {
  return meals.filter((m) => m.eaten_at).length;
}

export function weekSeries(days: TNutritionDay[], anyDateInWeek: string): TWeekSeries {
  const dates = weekDates(anyDateInWeek);
  const byDate = new Map(days.map((d) => [d.plan_date, d]));
  const week = dates.map((date) => byDate.get(date) ?? null);
  const planned = week.filter((d): d is TNutritionDay => d !== null);
  const average = (pick: (d: TNutritionDay) => number) =>
    planned.length ? Math.round(planned.reduce((s, d) => s + pick(d), 0) / planned.length) : null;

  return {
    dates,
    labels: WEEKDAY_LABELS,
    planned: week.map((d) => d?.calories ?? null),
    eaten: week.map((d) => (d ? eatenCalories(d.meals) : null)),
    protein: week.map((d) => d?.protein_g ?? null),
    avgCalories: average((d) => d.calories),
    avgProtein: average((d) => d.protein_g),
  };
}

// The viewer's own calendar day, used as "today" in the views.
export function todayIso(): string {
  const now = new Date();
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}
