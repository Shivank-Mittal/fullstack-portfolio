import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SUPERBASE_CLIENT } from '../../../superbase/superbase.provider';
import { createQueryMock } from '../../../testing/supabase-query-mock';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../store/auth/auth.store';
import { NutritionService } from './nutrition.service';
import { NUTRITION_MOCK_DAY_COUNT } from '../../mock/nutrition.mock';

function setup(client: unknown, loggedIn = true) {
  TestBed.configureTestingModule({
    providers: [
      { provide: SUPERBASE_CLIENT, useValue: client },
      { provide: AuthStore, useValue: { loggedIn: signal(loggedIn) } },
    ],
  });
  return TestBed.inject(NutritionService);
}

const meal = (id: string, position: number) => ({ id, position, calories: 100, eaten_at: null });

describe('NutritionService', () => {
  describe('with Supabase (logged in)', () => {
    it('listDays reads days with meals newest first', async () => {
      const calls: unknown[][] = [];
      const day = { plan_date: '2026-10-30', meals: [meal('c', 2), meal('a', 0), meal('b', 1)] };
      const service = setup(createQueryMock({ data: [day], error: null }, calls));

      const days = await service.listDays('2026-10-26', '2026-11-01');

      expect(calls).toContainEqual(['from', 'nutrition_days']);
      expect(calls).toContainEqual(['gte', 'plan_date', '2026-10-26']);
      expect(calls).toContainEqual(['lte', 'plan_date', '2026-11-01']);
      expect(calls).toContainEqual(['order', 'plan_date', { ascending: false }]);
      expect(days[0].meals.map((m) => m.position)).toEqual([0, 1, 2]);
    });

    it('listDaysBefore pages older days newest first', async () => {
      const calls: unknown[][] = [];
      const service = setup(createQueryMock({ data: [], error: null }, calls));

      await service.listDaysBefore('2026-10-20', 14);

      expect(calls).toContainEqual(['lt', 'plan_date', '2026-10-20']);
      expect(calls).toContainEqual(['order', 'plan_date', { ascending: false }]);
      expect(calls).toContainEqual(['limit', 14]);
    });

    it('listDaysBefore starts from the newest day when no cursor is given', async () => {
      const calls: unknown[][] = [];
      const service = setup(createQueryMock({ data: [], error: null }, calls));

      await service.listDaysBefore(null, 14);

      expect(calls.some((c) => c[0] === 'lt')).toBe(false);
      expect(calls).toContainEqual(['limit', 14]);
    });

    it('getDay returns null when no plan is saved', async () => {
      const service = setup(createQueryMock({ data: null, error: null }));
      expect(await service.getDay('2026-11-05')).toBeNull();
    });

    it('getNeighbours returns the nearest saved dates on each side', async () => {
      const calls: unknown[][] = [];
      const service = setup(
        createQueryMock({ data: [{ plan_date: '2026-10-29' }], error: null }, calls),
      );

      const { prev, next } = await service.getNeighbours('2026-10-30');

      expect(prev).toBe('2026-10-29');
      expect(next).toBe('2026-10-29');
      expect(calls).toContainEqual(['lt', 'plan_date', '2026-10-30']);
      expect(calls).toContainEqual(['gt', 'plan_date', '2026-10-30']);
    });

    it('setEaten writes a timestamp or null to that meal only', async () => {
      const calls: unknown[][] = [];
      const service = setup(createQueryMock({ data: { eaten_at: 'T' }, error: null }, calls));

      expect(await service.setEaten('m1', true)).toBe('T');
      expect(calls).toContainEqual(['from', 'nutrition_meals']);
      expect(calls.find((c) => c[0] === 'update')?.[1]).toEqual({ eaten_at: expect.any(String) });
      expect(calls).toContainEqual(['eq', 'id', 'm1']);

      await service.setEaten('m1', false);
      expect(calls.filter((c) => c[0] === 'update').at(-1)?.[1]).toEqual({ eaten_at: null });
    });

    it('setEaten throws when Supabase returns an error', async () => {
      const service = setup(createQueryMock({ data: null, error: new Error('denied') }));
      await expect(service.setEaten('m1', true)).rejects.toThrow('denied');
    });

    it('returns empty results on the server', async () => {
      const service = setup(null);
      expect(await service.listDays()).toEqual([]);
      expect(await service.getDay('2026-10-30')).toBeNull();
      expect(await service.getNeighbours('2026-10-30')).toEqual({ prev: null, next: null });
    });
  });

  describe('sample data (dev build, logged out)', () => {
    it('serves sample days without touching Supabase', async () => {
      const calls: unknown[][] = [];
      const service = setup(createQueryMock({ data: [], error: null }, calls), false);

      expect((await service.listDays()).length).toBe(NUTRITION_MOCK_DAY_COUNT);
      expect(calls).toEqual([]);
    });

    it('pages through sample days', async () => {
      const service = setup(null, false);
      const first = await service.listDaysBefore(null, 20);
      const rest = await service.listDaysBefore(first.at(-1)!.plan_date, 20);

      expect(first.length).toBe(20);
      expect(rest.length).toBe(NUTRITION_MOCK_DAY_COUNT - 20);
      expect(rest[0].plan_date < first.at(-1)!.plan_date).toBe(true);
    });

    it('keeps sample ticks in memory', async () => {
      const service = setup(null, false);
      const [day] = await service.listDays();
      const last = day.meals.at(-1)!;

      await service.setEaten(last.id, true);

      expect((await service.getDay(day.plan_date))!.meals.at(-1)!.eaten_at).not.toBeNull();
    });

    it('finds neighbours among the sample days', async () => {
      const service = setup(null, false);
      const days = await service.listDays();
      expect(await service.getNeighbours(days[1].plan_date)).toEqual({
        prev: days[2].plan_date,
        next: days[0].plan_date,
      });
    });

    it('is never used in a production build', async () => {
      const calls: unknown[][] = [];
      environment.production = true;
      try {
        const service = setup(createQueryMock({ data: [], error: null }, calls), false);
        expect(await service.listDays()).toEqual([]);
        expect(calls).toContainEqual(['from', 'nutrition_days']);
      } finally {
        environment.production = false;
      }
    });
  });
});
