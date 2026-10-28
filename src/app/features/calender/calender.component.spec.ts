import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalenderComponent } from './calender.component';
import { CalenderService } from '../../service/calender/calender.service';
import { NutritionService } from '../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../types/TNutrition';

const PLAN = {
  id: 'd53',
  plan_date: '2026-10-30',
  day_number: 53,
  calories: 1460,
  protein_g: 72,
  carbs_g: 170,
  fat_g: 50,
  fiber_g: 30,
  stated_calories: 1450,
  stated_protein_g: 74,
  guidelines: [],
  meals: [
    { id: 'm1', position: 0, label: 'Morning', calories: 5, eaten_at: 'T' },
    { id: 'm2', position: 1, label: 'Breakfast', calories: 520, eaten_at: 'T' },
    { id: 'm3', position: 2, label: 'Lunch', calories: 480, eaten_at: null },
    { id: 'm4', position: 3, label: 'Evening snack', calories: 110, eaten_at: null },
    { id: 'm5', position: 4, label: 'Dinner', calories: 345, eaten_at: null },
  ],
} as unknown as TNutritionDay;

const EVENT = {
  title: 'Standup',
  start: '2026-10-30T09:00:00Z',
  end: '2026-10-30T09:15:00Z',
  description: '',
  location: '',
  source: 'google' as const,
  cancelled: false,
};

describe('CalenderComponent', () => {
  let component: CalenderComponent;
  let fixture: ComponentFixture<CalenderComponent>;
  let nutrition: { listDays: ReturnType<typeof vi.fn> };
  // Protected members, reached the way the template reaches them.
  const view = () => component as any;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  // FullCalendar keeps timers running, so whenStable() never settles; the data calls are
  // awaited directly and signals update synchronously.
  const settle = async () => {
    fixture.detectChanges();
  };

  beforeEach(async () => {
    nutrition = { listDays: vi.fn().mockResolvedValue([PLAN]) };
    await TestBed.configureTestingModule({
      imports: [CalenderComponent],
      providers: [
        provideRouter([]),
        {
          provide: CalenderService,
          useValue: {
            getCalendarData: vi
              .fn()
              .mockResolvedValue({ google: [EVENT], apple: [], metadata: {} }),
          },
        },
        { provide: NutritionService, useValue: nutrition },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the nutrition card for a selected date with a plan', async () => {
    await view().getCalendarData({ startStr: '2026-10-01', endStr: '2026-11-01' });
    view().selectedDate.set('2026-10-30');
    await settle();

    expect(nutrition.listDays).toHaveBeenCalledWith('2026-10-01', '2026-11-01');
    expect(text()).toContain('Day 53 · Friday plan');
    expect(text()).toContain('5 meals · 2 eaten');
    expect(text()).toContain('Next: Lunch · 480 kcal');
    expect(el().querySelector('a[href="/nutrition?day=2026-10-30"]')).toBeTruthy();
  });

  it('shows no card for a date without a plan', async () => {
    await view().getCalendarData({ startStr: '2026-10-01', endStr: '2026-11-01' });
    view().selectedDate.set('2026-11-05');
    await settle();
    expect(el().querySelector('app-nutrition-day-card')).toBeNull();
  });

  it('still shows events when loading plans fails', async () => {
    nutrition.listDays.mockRejectedValue(new Error('offline'));
    await view().getCalendarData({ startStr: '2026-10-01', endStr: '2026-11-01' });
    expect(view().calenderEvents().google.length).toBe(1);
    expect(view().nutritionDays()).toEqual([]);
  });
});
