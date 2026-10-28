# Nutrition Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A private `/nutrition` area that shows the meal plans saved by the Telegram bot (day list, month grid, week charts, full day page with a per-meal eaten checkbox) and a nutrition card on `/calendar`.

**Architecture:** One `eaten_at` column on `nutrition_meals` that only the owner may update; the bot copies ticks across when a plan is re-sent. One `NutritionService` talks to Supabase; pure helpers in `nutrition.utils.ts` do all date and total maths; standalone signal-based components render the views inside the existing protected `InformationComponent` layout.

**Tech Stack:** Angular 21 (standalone, signals, SSR), Supabase JS v2, Tailwind 4, `echarts@6.1.0` + `ngx-echarts@21.0.0`, Vitest + TestBed, Deno (edge function).

**Spec:** Claude Doc "Nutrition Page Plan", section **Build design** and **Proposed screens** — https://claude.ai/artifact/EMLi4EpyaYLYKRBT7tufVx

## Global Constraints

- Only the owner (`498ccf7e-4e97-45e5-8a54-08fb312b204f`) may read nutrition data or change `eaten_at`; the browser can never change any other column.
- Every view must work at phone width (375 px) and on desktop.
- Plans are read-only in the UI; they only change by sending a new plan to the bot.
- Headline format: `Day 53 · Friday plan` (no day number → `Friday plan`).
- Big number = AI total (`calories`); under it `Plan says 1450 kcal · 74 g protein` when stated totals exist.
- Eaten progress = sum of `calories` of meals with `eaten_at` set, shown as `Eaten 525 of 1460 kcal`.
- Charts render only in the browser; the server-rendered HTML shows the numbers.
- Supabase client is `null` on the server: every service method must handle that without throwing.
- **Dev access (temporary, for testing):** a dev build (`environment.production === false`) opens `/nutrition` and `/nutrition/:date` without login; prod requires login. `/resume` and `/calendar` always require login.
- **Dev sample data:** when a dev build is not logged in, `NutritionService` serves the sample days in `src/app/mock/nutrition.mock.ts` and keeps ticks in memory only. Logged in (any build), it reads Supabase. Prod never uses the mock.
- Commits: Conventional Commits, and stage only the files the task names (the branch has unrelated uncommitted work).

## Review Focus

1. **A plan re-sent with a different meal split** (a meal type added, removed or repeated) → ticks stay on the meals of the same type, in order; a vanished type loses its tick. Pinned in Task 2.
2. **Saving a tick fails** (network down, RLS refusal) → the checkbox goes back to its previous state and an error toast says "Couldn't save, try again". Pinned in Task 4.
3. **A date with no saved plan** (`/nutrition/2026-11-05`, or a calendar date without a plan) → "No plan saved for this day", the prev/next arrows still reach the nearest saved days, no crash. Pinned in Tasks 4 and 7.
4. **Server render** with the `null` Supabase client → pages render an empty state, no exception, no chart on the server. Pinned in Tasks 3 and 6.
5. **Time zones** — `'2026-10-30'` must always show as Friday 30 Oct, whatever the browser's zone. All helpers parse and format in UTC. Pinned in Task 3.

---

### Task 1: Commit the bot and tables already built

**Files:**

- Add: `supabase/functions/telegram-webhook/{index,plan,ai}.ts`, `supabase/migrations/20261028120000_nutrition.sql`, `supabase/config.toml`

- [ ] **Step 1: Commit only these files**

```bash
git add supabase/functions/telegram-webhook supabase/migrations/20261028120000_nutrition.sql supabase/config.toml
git commit -m "feat: telegram bot parses meal plans into nutrition tables"
```

---

### Task 2: Eaten column and tick carry-over in the bot

**Files:**

- Create: `supabase/migrations/20261029090000_nutrition_eaten.sql`
- Create: `supabase/functions/telegram-webhook/eaten.ts`
- Test: `supabase/functions/telegram-webhook/eaten.test.ts`
- Modify: `supabase/functions/telegram-webhook/index.ts` (`saveDay`)

**Interfaces:**

- Produces: column `nutrition_meals.eaten_at timestamptz null`; `carryEaten(oldMeals: { meal_type: string; eaten_at: string | null }[], newMeals: { meal_type: string }[]): (string | null)[]`

- [ ] **Step 1: Write the migration**

```sql
alter table public.nutrition_meals add column eaten_at timestamptz;

-- The browser may change eaten_at and nothing else.
revoke update on public.nutrition_meals from anon, authenticated;
grant update (eaten_at) on public.nutrition_meals to authenticated;

create policy "Owner marks meals eaten" on public.nutrition_meals
  for update to authenticated
  using (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid)
  with check (auth.uid() = '498ccf7e-4e97-45e5-8a54-08fb312b204f'::uuid);
```

- [ ] **Step 2: Write the failing tests** in `eaten.test.ts` (`import { assertEquals } from 'jsr:@std/assert@1'`)

```ts
Deno.test('same meals keep their ticks', () => {
  assertEquals(
    carryEaten(
      [
        { meal_type: 'breakfast', eaten_at: 'T1' },
        { meal_type: 'lunch', eaten_at: null },
      ],
      [{ meal_type: 'breakfast' }, { meal_type: 'lunch' }],
    ),
    ['T1', null],
  );
});
Deno.test('repeated type matches first with first, second with second', () => {
  assertEquals(
    carryEaten(
      [
        { meal_type: 'evening_snack', eaten_at: 'A' },
        { meal_type: 'evening_snack', eaten_at: 'B' },
      ],
      [{ meal_type: 'evening_snack' }, { meal_type: 'dinner' }, { meal_type: 'evening_snack' }],
    ),
    ['A', null, 'B'],
  );
});
Deno.test('a vanished type loses its tick and a new type starts unticked', () => {
  assertEquals(
    carryEaten([{ meal_type: 'mid_morning', eaten_at: 'T' }], [{ meal_type: 'breakfast' }]),
    [null],
  );
});
Deno.test('no old meals means nothing ticked', () => {
  assertEquals(carryEaten([], [{ meal_type: 'lunch' }]), [null]);
});
```

- [ ] **Step 3: Run and see them fail**

Run: `npx --yes deno@2 test supabase/functions/telegram-webhook/eaten.test.ts`
Expected: FAIL, module `./eaten.ts` not found.

- [ ] **Step 4: Implement `carryEaten` in `eaten.ts`** — match the nth meal of a type in the new list to the nth meal of that type in the old list.

- [ ] **Step 5: Run the tests**

Run: same command. Expected: 4 passed.

- [ ] **Step 6: Use it in `saveDay`** — before the delete, read the old meals ordered by position:
      `db.from('nutrition_days').select('nutrition_meals(meal_type, eaten_at, position)').eq('plan_date', day.plan_date).maybeSingle()`; sort them by `position`; after building `meals`, set each meal's `eaten_at` from `carryEaten(old, meals)` before the insert.

- [ ] **Step 7: Apply and deploy** (both change the live project: ask the user before running)

Run: `npx supabase db push` then `npx supabase functions deploy telegram-webhook`
Expected: migration applied; "Deployed Functions … telegram-webhook".

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20261029090000_nutrition_eaten.sql supabase/functions/telegram-webhook/eaten.ts supabase/functions/telegram-webhook/eaten.test.ts supabase/functions/telegram-webhook/index.ts
git commit -m "feat: keep eaten ticks when a plan is re-sent"
```

---

### Task 3: Types, date helpers and NutritionService

**Files:**

- Create: `src/app/types/TNutrition.ts`
- Create: `src/app/features/nutrition/nutrition.utils.ts`, test `nutrition.utils.spec.ts`
- Create: `src/app/service/nutrition/nutrition.service.ts`, test `nutrition.service.spec.ts`
- Create: `src/testing/supabase-query-mock.ts`
- Create: `src/app/mock/nutrition.mock.ts` — `NUTRITION_MOCK_DAYS: TNutritionDay[]`: 7 consecutive days ending on today's date (built with `shiftDate(todayIso(), -n)`), days 47–53, 5 meals each in the shape of the Day 53 sample plan (morning lemon water, breakfast, lunch, evening snack, dinner), two meals of the latest day ticked, stated totals 1450 kcal / 74 g, three guidelines.

**Interfaces:**

- Produces (types):
  ```ts
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
  ```
- Produces (utils, all UTC-based, dates are `YYYY-MM-DD` strings):
  `shiftDate(date, days): string` · `weekStart(date): string` (Monday) · `weekDates(date): string[]` (7) · `monthCells(month: 'YYYY-MM'): (string | null)[]` (Monday-first, padded to whole weeks) · `formatShortDate(date): string` → `Fri 30 Oct` · `dayHeadline(day): string` · `eatenCalories(meals): number` · `eatenCount(meals): number` · `weekSeries(days: TNutritionDay[], anyDateInWeek: string): TWeekSeries` · `todayIso(): string` (browser local date)
- Produces (service, `providedIn: 'root'`, injects `SUPERBASE_CLIENT`):
  `listDays(from?: string, to?: string): Promise<TNutritionDay[]>` (newest first, meals by position) · `getDay(date): Promise<TNutritionDay | null>` · `getNeighbours(date): Promise<{ prev: string | null; next: string | null }>` · `setEaten(mealId: string, eaten: boolean): Promise<string | null>` (returns the saved `eaten_at`, throws on error)
- Produces (testing): `createQueryMock(result: { data: unknown; error: unknown }, calls?: string[][])` → a `{ from }` object; `from(table)` records `['from', table]` and its query builder methods (`select`, `eq`, `gte`, `lte`, `lt`, `gt`, `order`, `limit`, `update`, `maybeSingle`, `single`) record `[method, ...args]` into `calls` and chain, and which awaits to `result`.

- [ ] **Step 1: Write failing util tests**

```ts
it('formats in UTC', () => expect(formatShortDate('2026-10-30')).toBe('Fri 30 Oct'));
it('weeks start on Monday', () => expect(weekStart('2026-11-01')).toBe('2026-10-26'));
it('weekDates spans Mon..Sun', () =>
  expect(weekDates('2026-10-30')).toEqual([
    '2026-10-26',
    '2026-10-27',
    '2026-10-28',
    '2026-10-29',
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
  ]));
it('monthCells pads to Monday', () => {
  const c = monthCells('2026-10');
  expect(c.slice(0, 4)).toEqual([null, null, null, '2026-10-01']);
  expect(c.length % 7).toBe(0);
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
  expect(s.avgCalories).toBe(1460);
  expect(s.avgProtein).toBe(72);
});
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/app/features/nutrition/nutrition.utils.spec.ts` → FAIL (module missing).
- [ ] **Step 3: Implement the types and utils.** Parse with `new Date(date + 'T00:00:00Z')`, format with `timeZone: 'UTC'`, locale `en-GB`.
- [ ] **Step 4: Run** — same command → all pass.
- [ ] **Step 5: Write failing service tests** (provide `SUPERBASE_CLIENT` with `createQueryMock(...)`; one test with `useValue: null`)

```ts
it('listDays reads days with meals newest first', async () => {
  const calls: string[][] = [];
  // mock returns one day whose meals are out of order
  ...
  const days = await service.listDays('2026-10-26', '2026-11-01');
  expect(calls).toContainEqual(['from', 'nutrition_days']);
  expect(calls).toContainEqual(['gte', 'plan_date', '2026-10-26']);
  expect(calls).toContainEqual(['lte', 'plan_date', '2026-11-01']);
  expect(calls).toContainEqual(['order', 'plan_date', { ascending: false }]);
  expect(days[0].meals.map((m) => m.position)).toEqual([0, 1, 2]);
});
it('getDay returns null when no plan is saved', async () => { /* data: null */ expect(await service.getDay('2026-11-05')).toBeNull(); });
it('setEaten writes a timestamp or null to that meal only', async () => {
  await service.setEaten('m1', true);
  expect(calls).toContainEqual(['from', 'nutrition_meals']);
  expect(calls.find((c) => c[0] === 'update')?.[1]).toEqual({ eaten_at: expect.any(String) });
  expect(calls).toContainEqual(['eq', 'id', 'm1']);
});
it('setEaten throws when Supabase returns an error', async () => { await expect(service.setEaten('m1', true)).rejects.toThrow(); });
it('returns empty results on the server', async () => {
  // SUPERBASE_CLIENT = null
  expect(await service.listDays()).toEqual([]); expect(await service.getDay('2026-10-30')).toBeNull();
  expect(await service.getNeighbours('2026-10-30')).toEqual({ prev: null, next: null });
});
```

Also, with `AuthStore.loggedIn()` false in a non-production build:

```ts
it('serves sample days in dev when logged out', async () => {
  expect((await service.listDays()).length).toBe(7);
  expect(calls).toEqual([]);
});
it('keeps sample ticks in memory', async () => {
  const [day] = await service.listDays();
  const m = day.meals.at(-1)!;
  await service.setEaten(m.id, true);
  expect((await service.getDay(day.plan_date))!.meals.at(-1)!.eaten_at).not.toBeNull();
});
```

The mock switch is a private `useMock(): boolean` = `!environment.production && !authStore.loggedIn()`; tests flip it by providing a stub `AuthStore` (`{ loggedIn: signal(false) }`) and spying on `useMock` for the production case.

- [ ] **Step 6: Run, see them fail** — `npx vitest run src/app/service/nutrition/nutrition.service.spec.ts`.
- [ ] **Step 7: Implement the service, the query mock and the sample data.** The mock path works on a deep copy of `NUTRITION_MOCK_DAYS` held in the service. Select `'*, meals:nutrition_meals(*)'`; sort meals by `position` in code. `getNeighbours` = two queries: `lt` + `order desc` + `limit 1`, and `gt` + `order asc` + `limit 1`, selecting `plan_date`. `setEaten` updates `{ eaten_at: eaten ? new Date().toISOString() : null }`, `.select('eaten_at').single()`.
- [ ] **Step 8: Run** — both spec files pass.
- [ ] **Step 9: Commit**

```bash
git add src/app/types/TNutrition.ts src/app/features/nutrition/nutrition.utils.ts src/app/features/nutrition/nutrition.utils.spec.ts src/app/service/nutrition src/testing/supabase-query-mock.ts
git commit -m "feat: nutrition service and date helpers"
```

---

### Task 4: Full day page `/nutrition/:date`

**Files:**

- Create: `src/app/features/nutrition/day/nutrition-day.component.{ts,html,css}`, test `nutrition-day.component.spec.ts`
- Modify: `src/app/app.routes.ts` — move `authGuard` from the `InformationComponent` parent onto the `resume` and `calendar` children; the nutrition children use a new `nutritionGuard`.
- Modify: `src/app/guard/auth.guard.ts` — `nutritionGuard: CanActivateFn` = allow when `!environment.production`, else behave exactly like `authGuard`. Test in `src/app/guard/auth.guard.spec.ts`: dev allows a logged-out user; production (`environment.production` patched to `true` in the test) redirects to `/auth`.

**Interfaces:**

- Consumes: `NutritionService.getDay/getNeighbours/setEaten`, `dayHeadline`, `formatShortDate`, `eatenCalories`, `ToastService.error`
- Produces: route `nutrition/:date` → `NutritionDayComponent` (reads `date` from `ActivatedRoute` paramMap, reloads when it changes)

Layout follows the "full day page · phone" mockup: arrows + headline + date; summary card (big `calories`, stated line, progress bar, `Eaten X of Y kcal`); macro row `P · C · F · Fiber`; one card per meal (checkbox, `label` + `time_window`, item names joined by `, `, `calories` right-aligned; tapping a card expands its items with quantities); `Guidelines` list. Max width ~ 640 px, centred on desktop.

- [ ] **Step 1: Write failing component tests** (stub `NutritionService` with `vi.fn()`s; provide `provideRouter([])` and an `ActivatedRoute` with `paramMap: of(convertToParamMap({ date: '2026-10-30' }))`)

```ts
it('shows the headline, totals and eaten progress', () => {
  /* day_number 53, calories 1460, stated 1450/74, two of five meals eaten summing 525 */
  expect(text()).toContain('Day 53 · Friday plan');
  expect(text()).toContain('Plan says 1450 kcal · 74 g protein');
  expect(text()).toContain('Eaten 525 of 1460 kcal');
});
it('ticking a meal saves it and updates progress', async () => {
  click(checkbox(2));
  await settle();
  expect(service.setEaten).toHaveBeenCalledWith('m3', true);
  expect(text()).toContain('Eaten 1005 of 1460 kcal');
});
it('rolls back and toasts when saving fails', async () => {
  service.setEaten.mockRejectedValue(new Error('x'));
  click(checkbox(2));
  await settle();
  expect(checkbox(2).checked).toBe(false);
  expect(toast.error).toHaveBeenCalledWith("Couldn't save, try again");
});
it('shows an empty state for a date with no plan but keeps the arrows', async () => {
  service.getDay.mockResolvedValue(null);
  service.getNeighbours.mockResolvedValue({ prev: '2026-10-30', next: null });
  expect(text()).toContain('No plan saved for this day');
  expect(link('prev').getAttribute('href')).toBe('/nutrition/2026-10-30');
});
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/app/features/nutrition/day/nutrition-day.component.spec.ts`.
- [ ] **Step 3: Implement the component and route.** Keep the loaded day in a `signal<TNutritionDay | null>`; toggle = optimistic `update` of the meal's `eaten_at`, then `setEaten`; on error restore the previous value and toast. Arrows are `routerLink`s, hidden when the neighbour is `null`.
- [ ] **Step 4: Run** — passes.
- [ ] **Step 5: Commit** — `git add src/app/features/nutrition/day src/app/app.routes.ts && git commit -m "feat: nutrition full day page with eaten checkboxes"`

---

### Task 5: `/nutrition` with Days and Month tabs, plus the nav entry

**Files:**

- Create: `src/app/features/nutrition/nutrition.component.{ts,html}` (tabs shell), test `nutrition.component.spec.ts`
- Create: `src/app/features/nutrition/days-list/nutrition-days-list.component.{ts,html}`
- Create: `src/app/features/nutrition/month/nutrition-month.component.{ts,html}`
- Modify: `src/app/app.routes.ts`, `src/app/page/information/information.sections.ts`, `src/app/page/information/information.component.ts`

**Interfaces:**

- Consumes: `NutritionService.listDays`, `monthCells`, `formatShortDate`, `eatenCount`, `todayIso`
- Produces: route `nutrition` → `NutritionComponent`; tab chosen by query param `view` = `days` (default) | `month` | `week`; `NutritionDaysListComponent` and `NutritionMonthComponent` (input `days: TNutritionDay[]`); export `HEALTH_SECTIONS: TUserNavSection` = `{ name: 'Health', id: 'health', enabled: true, items: [{ name: 'Nutrition', id: 'nutrition', enabled: true, router: '/nutrition', icon: faUtensils }] }`, added to `userNavbarInfo` after `SCHEDULE_SECTIONS`.

Rows follow the "day list" mockup: `Day 53 · Fri 30 Oct` / `1460 kcal · P 72 g · 2 of 5 eaten` / chevron, whole row links to `/nutrition/2026-10-30`. Month: arrows change the month (signal, starts at the current month), cells with a plan are marked and link to their day, today is outlined.

- [ ] **Step 1: Write failing tests**

```ts
it('lists days newest first with eaten counts', () => {
  expect(rows()[0].textContent).toContain('Day 53 · Fri 30 Oct');
  expect(rows()[0].textContent).toContain('2 of 5 eaten');
  expect(rows()[0].getAttribute('href')).toBe('/nutrition/2026-10-30');
});
it('shows an empty state when no plans are saved', () => {
  /* listDays → [] */ expect(text()).toContain('No plans yet. Send one to the Telegram bot.');
});
it('switches to the month tab from the query param', () => {
  /* view=month */ expect(query('app-nutrition-month')).toBeTruthy();
});
it('month marks only days with a plan', () => {
  expect(markedCells().map((c) => c.getAttribute('href'))).toEqual(['/nutrition/2026-10-30']);
});
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/app/features/nutrition/nutrition.component.spec.ts`.
- [ ] **Step 3: Implement shell, list, month, route and nav entry.** The shell loads all days once with `listDays()` and passes them down; tabs are `routerLink`s with `queryParams`.
- [ ] **Step 4: Run** — passes.
- [ ] **Step 5: Commit** — `git add src/app/features/nutrition/nutrition.component.* src/app/features/nutrition/days-list src/app/features/nutrition/month src/app/app.routes.ts src/app/page/information && git commit -m "feat: nutrition day list and month view"`

---

### Task 6: Week tab with ECharts

**Files:**

- Modify: `package.json` (`npm install echarts@6.1.0 ngx-echarts@21.0.0`)
- Create: `src/app/features/nutrition/week/nutrition-week.component.{ts,html}`, test `nutrition-week.component.spec.ts`
- Create: `src/app/features/nutrition/week/week-chart-options.ts`
- Modify: `src/app/features/nutrition/nutrition.component.html` (render it for `view=week`)

**Interfaces:**

- Consumes: `weekSeries`, `weekStart`, `shiftDate`, `formatShortDate`; days from the shell
- Produces: `NutritionWeekComponent` (input `days`); `weekChartOptions(series: TWeekSeries): EChartsCoreOption` — grouped bars `Planned kcal` / `Eaten kcal` per day on the left axis, `Protein g` line on the right axis, legend, tooltip.

The component holds the week as a signal (starts this week, arrows ±7 days), shows `26 Oct – 1 Nov`, then `Avg 1460 kcal · 72 g protein` (`–` when no planned days), then the chart inside `@defer (on idle)` whose `@placeholder` is a plain list of the seven days' planned/eaten numbers, so the server render has the numbers and no chart. Register ECharts via `provideEchartsCore({ echarts })` in the component's `providers`, importing only `BarChart`, `LineChart`, `GridComponent`, `TooltipComponent`, `LegendComponent`, `CanvasRenderer` from `echarts/*`.

- [ ] **Step 1: Write failing tests**

```ts
it('shows the week range and averages', () => {
  expect(text()).toContain('26 Oct – 1 Nov');
  expect(text()).toContain('Avg 1460 kcal · 72 g protein');
});
it('arrows move a week', () => {
  click(next());
  expect(text()).toContain('2 Nov – 8 Nov');
  expect(text()).toContain('Avg – kcal · – g protein');
});
it('builds bar and line series from the week', () => {
  const o = weekChartOptions(series) as any;
  expect(o.series.map((s: any) => s.type)).toEqual(['bar', 'bar', 'line']);
  expect(o.series[0].data).toEqual(series.planned);
});
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/app/features/nutrition/week/nutrition-week.component.spec.ts`.
- [ ] **Step 3: Install the packages and implement.**
- [ ] **Step 4: Run** — passes.
- [ ] **Step 5: Check the server build** — `npm run build` → succeeds with no `window is not defined` or ECharts errors.
- [ ] **Step 6: Commit** — `git add package.json package-lock.json src/app/features/nutrition/week src/app/features/nutrition/nutrition.component.html && git commit -m "feat: nutrition week view with ECharts"`

---

### Task 7: Nutrition card on `/calendar`

**Files:**

- Create: `src/app/features/nutrition/day-card/nutrition-day-card.component.{ts,html}`
- Modify: `src/app/features/calender/calender.component.{ts,html}`, `calender.component.spec.ts`

**Interfaces:**

- Consumes: `NutritionService.listDays(from, to)`, `dayHeadline`, `eatenCount`
- Produces: `NutritionDayCardComponent` (input `day: TNutritionDay`) as in the "calendar card" mockup: headline, `1460 kcal · P 72 g · C 170 g · F 50 g`, `5 meals · 2 eaten`, `Next: Lunch · 480 kcal` (first unticked meal; omitted when all are ticked), link `Open full day ›` to `/nutrition/<date>`.

`getCalendarData` also calls `listDays(dates.startStr.slice(0, 10), dates.endStr.slice(0, 10))` into a `nutritionDays` signal; plan dates get a `fc-day-has-plan` class through FullCalendar's `dayCellClassNames` (a small dot via CSS); the events panel shows the card for `selectedDate` when one exists. A failed nutrition load must not block calendar events.

- [ ] **Step 1: Write failing tests** in `calender.component.spec.ts` (stub `CalenderService` and `NutritionService`)

```ts
it('shows the nutrition card for a selected date with a plan', async () => {
  component.selectedDate.set('2026-10-30');
  await settle();
  expect(text()).toContain('Day 53 · Friday plan');
  expect(text()).toContain('Next: Lunch · 480 kcal');
});
it('shows no card for a date without a plan', async () => {
  component.selectedDate.set('2026-11-05');
  await settle();
  expect(query('app-nutrition-day-card')).toBeNull();
});
it('still shows events when loading plans fails', async () => {
  nutrition.listDays.mockRejectedValue(new Error('x'));
  await component.getCalendarData({ startStr: '2026-10-01', endStr: '2026-11-01' });
  expect(component.calenderEvents().google.length).toBe(1);
});
```

- [ ] **Step 2: Run, see them fail** — `npx vitest run src/app/features/calender/calender.component.spec.ts`.
- [ ] **Step 3: Implement the card and the calendar changes.**
- [ ] **Step 4: Run** — passes.
- [ ] **Step 5: Commit** — `git add src/app/features/nutrition/day-card src/app/features/calender && git commit -m "feat: show the day's nutrition plan on the calendar"`

---

### Task 8: Whole-app check

- [ ] **Step 1: All unit tests** — `ng test --watch=false` → all pass.
- [ ] **Step 2: Build** — `npm run build` → succeeds.
- [ ] **Step 3: In the browser** (`npm start`, logged in as the owner, at 375 px and desktop): `/nutrition` shows the saved days; Month and Week tabs work; a day page ticks and unticks a meal and survives a reload; `/calendar` shows the dot and the card. Re-send the same plan to the bot and confirm the ticks are still there.
- [ ] **Step 4: Format** — `npm run format:check` → clean (run `npm run format` and commit as `style:` if not).
