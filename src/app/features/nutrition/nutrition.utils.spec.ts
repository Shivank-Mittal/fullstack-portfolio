import { TNutritionDay, TNutritionMeal } from '../../types/TNutrition';
import {
  dayHeadline,
  eatenCalories,
  eatenCount,
  formatShortDate,
  monthCells,
  shiftDate,
  weekDates,
  weekSeries,
  weekStart,
} from './nutrition.utils';

describe('nutrition utils', () => {
  it('formats in UTC', () => {
    expect(formatShortDate('2026-10-30')).toBe('Fri 30 Oct');
  });

  it('shifts across a month boundary', () => {
    expect(shiftDate('2026-10-31', 1)).toBe('2026-11-01');
    expect(shiftDate('2026-11-01', -1)).toBe('2026-10-31');
  });

  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-01')).toBe('2026-10-26');
    expect(weekStart('2026-10-26')).toBe('2026-10-26');
  });

  it('weekDates spans Mon..Sun', () => {
    expect(weekDates('2026-10-30')).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });

  it('monthCells pads to Monday', () => {
    const cells = monthCells('2026-10');
    expect(cells.slice(0, 4)).toEqual([null, null, null, '2026-10-01']);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean).length).toBe(31);
  });

  it('headline with and without day number', () => {
    expect(dayHeadline({ plan_date: '2026-10-30', day_number: 53 } as TNutritionDay)).toBe(
      'Day 53 · Friday plan',
    );
    expect(dayHeadline({ plan_date: '2026-10-30', day_number: null } as TNutritionDay)).toBe(
      'Friday plan',
    );
  });

  it('eaten totals count only ticked meals', () => {
    const meals = [
      { calories: 5, eaten_at: 'x' },
      { calories: 520, eaten_at: 'y' },
      { calories: 480, eaten_at: null },
    ] as TNutritionMeal[];
    expect(eatenCalories(meals)).toBe(525);
    expect(eatenCount(meals)).toBe(2);
  });

  it('weekSeries leaves gaps for days without a plan and averages only planned days', () => {
    const s = weekSeries(
      [
        {
          plan_date: '2026-10-30',
          calories: 1460,
          protein_g: 72,
          meals: [],
        } as unknown as TNutritionDay,
      ],
      '2026-10-28',
    );
    expect(s.labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(s.planned).toEqual([null, null, null, null, 1460, null, null]);
    expect(s.eaten.at(4)).toBe(0);
    expect(s.eaten.at(0)).toBeNull();
    expect(s.avgCalories).toBe(1460);
    expect(s.avgProtein).toBe(72);
  });

  it('weekSeries averages are null for an empty week', () => {
    const s = weekSeries([], '2026-11-04');
    expect(s.avgCalories).toBeNull();
    expect(s.avgProtein).toBeNull();
  });
});
