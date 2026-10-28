import { ComponentFixture, DeferBlockBehavior, TestBed } from '@angular/core/testing';
import { NutritionWeekComponent } from './nutrition-week.component';
import { weekChartOptions } from './week-chart-options';
import { weekSeries } from '../nutrition.utils';
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

describe('NutritionWeekComponent', () => {
  let fixture: ComponentFixture<NutritionWeekComponent>;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const button = (label: string) =>
    el().querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!;

  beforeEach(async () => {
    // Keep the chart's @defer on its placeholder: the server render shows these numbers.
    await TestBed.configureTestingModule({
      imports: [NutritionWeekComponent],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionWeekComponent);
    fixture.componentRef.setInput('days', DAYS);
    fixture.componentRef.setInput('anchor', '2026-10-28');
    fixture.detectChanges();
  });

  it('shows the week range and averages', () => {
    expect(text()).toContain('26 Oct – 1 Nov');
    expect(text()).toContain('Avg 1460 kcal · 72 g protein');
  });

  it('lists planned and eaten numbers per day before the chart loads', () => {
    expect(text()).toContain('Fri');
    expect(text()).toContain('1460');
    expect(text()).toContain('525');
  });

  it('arrows move a week', () => {
    button('Next week').click();
    fixture.detectChanges();
    expect(text()).toContain('2 Nov – 8 Nov');
    expect(text()).toContain('Avg – kcal · – g protein');

    button('Previous week').click();
    button('Previous week').click();
    fixture.detectChanges();
    expect(text()).toContain('19 Oct – 25 Oct');
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
