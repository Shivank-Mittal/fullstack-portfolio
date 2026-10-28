import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { NutritionStatisticsComponent } from './nutrition-statistics.component';
import { weekChartOptions } from './week-chart-options';
import { weekSeries } from '../nutrition.utils';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../../types/TNutrition';

const DAYS = [
  {
    plan_date: '2026-10-30',
    calories: 1460,
    protein_g: 72,
    meals: [
      { calories: 525, eaten_at: 'T' },
      { calories: 935, eaten_at: null },
    ],
  },
] as unknown as TNutritionDay[];

describe('NutritionStatisticsComponent', () => {
  let fixture: ComponentFixture<NutritionStatisticsComponent>;
  let service: { listDays: ReturnType<typeof vi.fn> };
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const tile = (i: number) =>
    el().querySelectorAll('.stat-tile')[i].textContent?.replace(/\s+/g, ' ').trim();
  const button = (label: string) =>
    el().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    service = {
      listDays: vi
        .fn()
        .mockImplementation(async (from: string) => (from === '2026-10-26' ? DAYS : [])),
    };
    // Keep the chart's @defer on its placeholder: the server render shows these numbers.
    await TestBed.configureTestingModule({
      imports: [NutritionStatisticsComponent],
      providers: [{ provide: NutritionService, useValue: service }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionStatisticsComponent);
    fixture.componentRef.setInput('anchor', '2026-10-28');
    fixture.detectChanges();
    await settle();
  });

  it('loads the week and shows its range and averages', () => {
    expect(service.listDays).toHaveBeenCalledWith('2026-10-26', '2026-11-01');
    expect(text()).toContain('26 Oct – 1 Nov');
    expect(tile(0)).toBe('Avg planned1460 kcal');
    expect(tile(1)).toBe('Avg protein72 g');
  });

  it('lists planned and eaten numbers per day before the chart loads', () => {
    expect(text()).toContain('Fri');
    expect(text()).toContain('1460');
    expect(text()).toContain('525');
  });

  it('arrows load another week', async () => {
    button('Next week').click();
    await settle();
    expect(service.listDays).toHaveBeenLastCalledWith('2026-11-02', '2026-11-08');
    expect(text()).toContain('2 Nov – 8 Nov');
    expect(tile(0)).toBe('Avg planned– kcal');
  });
});

describe('weekChartOptions', () => {
  it('builds planned and eaten bars plus a protein line', () => {
    const series = weekSeries(DAYS, '2026-10-28');
    const options = weekChartOptions(series) as {
      series: { type: string; name: string; data: unknown[] }[];
      xAxis: { data: string[] };
    };
    expect(options.series.map((s) => s.type)).toEqual(['bar', 'bar', 'line']);
    expect(options.series.map((s) => s.name)).toEqual(['Planned kcal', 'Eaten kcal', 'Protein g']);
    expect(options.series[0].data).toEqual(series.planned);
    expect(options.series[1].data).toEqual(series.eaten);
    expect(options.series[2].data).toEqual(series.protein);
    expect(options.xAxis.data).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});
