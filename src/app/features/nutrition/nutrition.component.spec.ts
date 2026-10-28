import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NutritionComponent } from './nutrition.component';
import { NutritionService } from '../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../types/TNutrition';
import { shiftDate, todayIso } from './nutrition.utils';

const today = todayIso();
const yesterday = shiftDate(today, -1);

const day = (plan_date: string, day_number: number): TNutritionDay =>
  ({
    id: `d${day_number}`,
    plan_date,
    day_number,
    calories: 1460,
    protein_g: 72,
    carbs_g: 170,
    fat_g: 50,
    fiber_g: 30,
    stated_calories: null,
    stated_protein_g: null,
    guidelines: [],
    meals: [],
  }) as unknown as TNutritionDay;

describe('NutritionComponent', () => {
  let fixture: ComponentFixture<NutritionComponent>;
  let service: Record<string, ReturnType<typeof vi.fn>>;
  const el = () => fixture.nativeElement as HTMLElement;
  const query = (selector: string) => el().querySelector(selector);

  async function create(
    params: Record<string, string> = {},
    days = [day(today, 53), day(yesterday, 52)],
    canView = true,
  ) {
    service = {
      listDaysBefore: vi.fn().mockResolvedValue(days),
      listDays: vi.fn().mockResolvedValue(days),
      getDay: vi
        .fn()
        .mockImplementation(async (date: string) => days.find((d) => d.plan_date === date) ?? null),
      getNeighbours: vi.fn().mockResolvedValue({ prev: null, next: null }),
      setEaten: vi.fn(),
      canView: vi.fn().mockResolvedValue(canView),
      canEdit: vi.fn().mockReturnValue(true),
    };
    await TestBed.configureTestingModule({
      imports: [NutritionComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(params)) } },
        { provide: NutritionService, useValue: service },
      ],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('opens the Plans tab on today with the days box beside it', async () => {
    await create();
    expect(query('app-nutrition-days-list')).toBeTruthy();
    expect(service['getDay']).toHaveBeenCalledWith(today);
    expect(query('.split')?.classList).not.toContain('has-day');
  });

  it('falls back to the newest plan when today has none', async () => {
    await create({}, [day(yesterday, 52)]);
    expect(service['getDay']).toHaveBeenCalledWith(yesterday);
  });

  it('shows the day picked in the URL and switches a phone to the plan', async () => {
    await create({ day: yesterday });
    expect(service['getDay']).toHaveBeenCalledWith(yesterday);
    expect(query('.split')?.classList).toContain('has-day');
    expect(query('.back-link')?.getAttribute('href')).toBe('/');
  });

  it('switches to the month tab from the query param', async () => {
    await create({ view: 'month' });
    expect(query('app-nutrition-month')).toBeTruthy();
    expect(query('app-nutrition-days-list')).toBeNull();
  });

  it('month marks only days with a plan and opens them in the Plans tab', async () => {
    await create({ view: 'month' }, [day(today, 53)]);
    const marked = Array.from(el().querySelectorAll('a.month-cell.has-plan'));
    expect(marked.map((c) => c.getAttribute('href'))).toEqual([`/nutrition?day=${today}`]);
  });

  it('tells a login that is not on the viewers list it has no access', async () => {
    await create({}, [day(today, 53)], false);
    expect(el().textContent).toContain("You don't have access to these plans.");
    expect(query('app-nutrition-days-list')).toBeNull();
    expect(query('.tabs')).toBeNull();
  });

  it('switches to the statistics tab from the query param', async () => {
    await create({ view: 'statistics' });
    expect(query('app-nutrition-statistics')).toBeTruthy();
  });
});
