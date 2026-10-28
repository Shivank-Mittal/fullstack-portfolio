import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NutritionComponent } from './nutrition.component';
import { NutritionService } from '../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../types/TNutrition';
import { shiftDate, todayIso } from './nutrition.utils';

const today = todayIso();
const yesterday = shiftDate(today, -1);

const day = (plan_date: string, day_number: number, eaten: number): TNutritionDay =>
  ({
    id: `d${day_number}`,
    plan_date,
    day_number,
    calories: 1460,
    protein_g: 72,
    carbs_g: 170,
    fat_g: 50,
    fiber_g: 30,
    stated_calories: 1450,
    stated_protein_g: 74,
    guidelines: [],
    meals: [0, 1, 2, 3, 4].map((i) => ({
      id: `m${day_number}-${i}`,
      position: i,
      calories: 100,
      eaten_at: i < eaten ? 'T' : null,
    })),
  }) as unknown as TNutritionDay;

describe('NutritionComponent', () => {
  let fixture: ComponentFixture<NutritionComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const rows = () => Array.from(el().querySelectorAll<HTMLAnchorElement>('a.day-row'));

  async function create(days: TNutritionDay[], view?: string) {
    await TestBed.configureTestingModule({
      imports: [NutritionComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap(view ? { view } : {})) },
        },
        { provide: NutritionService, useValue: { listDays: vi.fn().mockResolvedValue(days) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('lists days newest first with eaten counts', async () => {
    await create([day(today, 53, 2), day(yesterday, 52, 5)]);
    expect(rows().length).toBe(2);
    expect(rows()[0].textContent).toContain('Day 53 ·');
    expect(rows()[0].textContent).toContain('1460 kcal · P 72 g · 2 of 5 eaten');
    expect(rows()[0].getAttribute('href')).toBe(`/nutrition/${today}`);
    expect(rows()[1].textContent).toContain('5 of 5 eaten');
  });

  it('shows an empty state when no plans are saved', async () => {
    await create([]);
    expect(text()).toContain('No plans yet. Send one to the Telegram bot.');
  });

  it('switches to the month tab from the query param', async () => {
    await create([day(today, 53, 2)], 'month');
    expect(el().querySelector('app-nutrition-month')).toBeTruthy();
    expect(el().querySelector('app-nutrition-days-list')).toBeNull();
  });

  it('month marks only days with a plan', async () => {
    await create([day(today, 53, 2)], 'month');
    const marked = Array.from(el().querySelectorAll('a.month-cell.has-plan'));
    expect(marked.map((c) => c.getAttribute('href'))).toEqual([`/nutrition/${today}`]);
  });
});
