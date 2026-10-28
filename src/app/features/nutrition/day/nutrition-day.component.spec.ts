import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionDayComponent } from './nutrition-day.component';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { ToastService } from '../../../service/toast-service/toast.service';
import { TNutritionDay, TNutritionMeal } from '../../../types/TNutrition';

const meal = (id: string, position: number, label: string, calories: number, eaten: boolean) =>
  ({
    id,
    position,
    label,
    calories,
    meal_type: 'lunch',
    time_window: null,
    protein_g: 10,
    carbs_g: 10,
    fat_g: 5,
    fiber_g: 2,
    items: [
      {
        name: `${label} food`,
        quantity: '1 bowl',
        calories,
        protein_g: 10,
        carbs_g: 10,
        fat_g: 5,
        fiber_g: 2,
      },
    ],
    eaten_at: eaten ? '2026-10-30T08:00:00Z' : null,
  }) as TNutritionMeal;

const DAY: TNutritionDay = {
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
  guidelines: ['Walk 10,000 steps.'],
  meals: [
    meal('m1', 0, 'Morning', 5, true),
    meal('m2', 1, 'Breakfast', 520, true),
    meal('m3', 2, 'Lunch', 480, false),
    meal('m4', 3, 'Evening snack', 110, false),
    meal('m5', 4, 'Dinner', 345, false),
  ],
};

describe('NutritionDayComponent', () => {
  let fixture: ComponentFixture<NutritionDayComponent>;
  let service: {
    getDay: ReturnType<typeof vi.fn>;
    getNeighbours: ReturnType<typeof vi.fn>;
    setEaten: ReturnType<typeof vi.fn>;
    canEdit: ReturnType<typeof vi.fn>;
  };
  let toast: { error: ReturnType<typeof vi.fn> };

  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const checkbox = (i: number) =>
    el().querySelectorAll<HTMLInputElement>('input[type=checkbox]')[i];
  const link = (name: string) => el().querySelector(`[data-test=${name}]`);
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  async function create() {
    await TestBed.configureTestingModule({
      imports: [NutritionDayComponent],
      providers: [
        provideRouter([]),
        { provide: NutritionService, useValue: service },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionDayComponent);
    fixture.componentRef.setInput('date', '2026-10-30');
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    service = {
      getDay: vi.fn().mockResolvedValue(structuredClone(DAY)),
      getNeighbours: vi.fn().mockResolvedValue({ prev: '2026-10-29', next: null }),
      setEaten: vi.fn().mockResolvedValue('2026-10-30T13:00:00Z'),
      canEdit: vi.fn().mockReturnValue(true),
    };
    toast = { error: vi.fn() };
  });

  it('shows the headline, totals and eaten progress', async () => {
    await create();
    expect(service.getDay).toHaveBeenCalledWith('2026-10-30');
    expect(text()).toContain('Day 53 · Friday plan');
    expect(text()).toContain('1460 kcal');
    expect(text()).toContain('Plan says 1450 kcal · 74 g protein');
    expect(text()).toContain('Eaten 525 of 1460 kcal');
    expect(text()).toContain('Walk 10,000 steps.');
  });

  it('ticking a meal saves it and updates progress', async () => {
    await create();
    checkbox(2).click();
    await settle();
    expect(service.setEaten).toHaveBeenCalledWith('m3', true);
    expect(text()).toContain('Eaten 1005 of 1460 kcal');
  });

  it('shows every item with its quantity without opening anything', async () => {
    await create();
    expect(el().querySelector('details')).toBeNull();
    expect(text()).toContain('Lunch food · 1 bowl');
    expect(text()).toContain('Dinner food · 1 bowl');
  });

  it('reports the updated day after a tick is saved', async () => {
    await create();
    const seen: TNutritionDay[] = [];
    fixture.componentInstance.dayChange.subscribe((d) => seen.push(d));
    checkbox(2).click();
    await settle();
    expect(seen.at(-1)?.meals[2].eaten_at).toBe('2026-10-30T13:00:00Z');
  });

  it('loads the new day when the date changes', async () => {
    await create();
    fixture.componentRef.setInput('date', '2026-10-29');
    await settle();
    expect(service.getDay).toHaveBeenLastCalledWith('2026-10-29');
  });

  it('is read-only for a viewer', async () => {
    service.canEdit.mockReturnValue(false);
    await create();
    expect(checkbox(0).disabled).toBe(true);
    expect(checkbox(2).disabled).toBe(true);
    expect(text()).toContain('View only');
  });

  it('rolls back and toasts when saving fails', async () => {
    service.setEaten.mockRejectedValue(new Error('offline'));
    await create();
    checkbox(2).click();
    await settle();
    expect(checkbox(2).checked).toBe(false);
    expect(text()).toContain('Eaten 525 of 1460 kcal');
    expect(toast.error).toHaveBeenCalledWith("Couldn't save, try again");
  });

  it('shows an empty state for a date with no plan but keeps the arrows', async () => {
    service.getDay.mockResolvedValue(null);
    service.getNeighbours.mockResolvedValue({ prev: '2026-10-29', next: null });
    await create();
    expect(text()).toContain('No plan saved for this day');
    expect(link('prev')?.getAttribute('href')).toBe('/nutrition?day=2026-10-29');
    expect(link('next')).toBeNull();
  });
});
