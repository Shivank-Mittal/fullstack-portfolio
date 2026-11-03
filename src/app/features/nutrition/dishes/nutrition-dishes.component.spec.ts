import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionDishesComponent } from './nutrition-dishes.component';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TDishAppearance, TDishStat } from '../../../types/TNutrition';

const DISHES: TDishStat[] = [
  { name: 'Apple', category: 'fruit', days_planned: 9, last_planned: '2026-11-02' },
  { name: 'Avocado toast', category: 'grains_breads', days_planned: 4, last_planned: '2026-10-30' },
  { name: 'Lemon water', category: 'drinks_teas', days_planned: 12, last_planned: '2026-11-03' },
];

const APPEARANCES: TDishAppearance[] = [
  {
    dish: 'Avocado toast',
    category: 'grains_breads',
    plan_date: '2026-10-30',
    day_number: 53,
    meal_type: 'breakfast',
    meal_label: 'Breakfast',
    eaten_at: '2026-10-30T08:00:00Z',
    item_name: 'avocado toast (multi grain bread)',
    quantity: '1',
    calories: 250,
    protein_g: 8,
  },
  {
    dish: 'Avocado toast',
    category: 'grains_breads',
    plan_date: '2026-10-21',
    day_number: 44,
    meal_type: 'dinner',
    meal_label: 'Dinner',
    eaten_at: null,
    item_name: 'Avocado toast with paneer',
    quantity: '1-2',
    calories: 320,
    protein_g: 14,
  },
];

describe('NutritionDishesComponent', () => {
  let fixture: ComponentFixture<NutritionDishesComponent>;
  let service: {
    listDishes: ReturnType<typeof vi.fn>;
    getDishAppearances: ReturnType<typeof vi.fn>;
  };
  const el = () => fixture.nativeElement as HTMLElement;
  const text = (node: Element | null = el()) =>
    node?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const rows = () => Array.from(el().querySelectorAll<HTMLAnchorElement>('a.dish-row'));
  const names = () => rows().map((r) => text(r.querySelector('.dish-name')));
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  async function create(dish: string | null = null, dishes = DISHES) {
    service = {
      listDishes: vi.fn().mockResolvedValue(dishes),
      getDishAppearances: vi.fn().mockResolvedValue(APPEARANCES),
    };
    await TestBed.configureTestingModule({
      imports: [NutritionDishesComponent],
      providers: [provideRouter([]), { provide: NutritionService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionDishesComponent);
    fixture.componentRef.setInput('dish', dish);
    fixture.detectChanges();
    await settle();
  }

  function search(term: string) {
    const input = el().querySelector<HTMLInputElement>('input[type=search]')!;
    input.value = term;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('lists every dish, most planned first, with its category and how often', async () => {
    await create();
    expect(service.listDishes).toHaveBeenCalledWith('');
    expect(names()).toEqual(['Lemon water', 'Apple', 'Avocado toast']);
    expect(text(rows()[1])).toContain('Fruit');
    expect(text(rows()[1])).toContain('On 9 days · last Mon 2 Nov');
  });

  it('filters by name as you type, ignoring case, without asking the server again', async () => {
    await create();
    search('AVO');
    expect(names()).toEqual(['Avocado toast']);
    expect(service.listDishes).toHaveBeenCalledTimes(1);
  });

  it('says so when nothing matches', async () => {
    await create();
    search('pizza');
    expect(text()).toContain('No dishes match "pizza"');
  });

  it('can sort A to Z', async () => {
    await create();
    el().querySelector<HTMLButtonElement>('button[data-sort=az]')!.click();
    fixture.detectChanges();
    expect(names()).toEqual(['Apple', 'Avocado toast', 'Lemon water']);
  });

  it('opens a dish from its row', async () => {
    await create();
    expect(rows()[2].getAttribute('href')).toBe('/nutrition?view=dishes&dish=Avocado%20toast');
  });

  it('shows an empty catalog plainly', async () => {
    await create(null, []);
    expect(text()).toContain('No dishes yet. They appear once plans are saved.');
  });

  it('shows the days a dish was planned, each linking to that day', async () => {
    await create('Avocado toast');
    expect(service.getDishAppearances).toHaveBeenCalledWith('Avocado toast');
    expect(text(el().querySelector('h2'))).toBe('Avocado toast');
    expect(text()).toContain('Planned on 2 days');

    const days = Array.from(el().querySelectorAll<HTMLAnchorElement>('a.appearance-row'));
    expect(days.length).toBe(2);
    expect(text(days[0])).toContain('Fri 30 Oct · Day 53');
    expect(text(days[0])).toContain('Breakfast');
    expect(text(days[0])).toContain('avocado toast (multi grain bread) · 1');
    expect(text(days[0])).toContain('Eaten');
    expect(text(days[1])).not.toContain('Eaten');
    expect(days[0].getAttribute('href')).toBe('/nutrition?day=2026-10-30');
    expect(el().querySelector('a.back-to-dishes')?.getAttribute('href')).toBe(
      '/nutrition?view=dishes',
    );
  });
});
