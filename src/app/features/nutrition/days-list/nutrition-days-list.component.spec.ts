import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NutritionDaysListComponent, DAYS_PAGE_SIZE } from './nutrition-days-list.component';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../../types/TNutrition';
import { shiftDate, todayIso } from '../nutrition.utils';

const today = todayIso();
const day = (back: number): TNutritionDay =>
  ({
    id: `d${back}`,
    plan_date: shiftDate(today, -back),
    day_number: 53 - back,
    calories: 1460,
    protein_g: 72,
    meals: [
      { id: 'a', eaten_at: 'T' },
      { id: 'b', eaten_at: null },
    ],
  }) as unknown as TNutritionDay;

const page = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => day(from + i));

describe('NutritionDaysListComponent', () => {
  let fixture: ComponentFixture<NutritionDaysListComponent>;
  let service: { listDaysBefore: ReturnType<typeof vi.fn> };
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => el().textContent?.replace(/\s+/g, ' ') ?? '';
  const rows = () => Array.from(el().querySelectorAll<HTMLAnchorElement>('a.day-row'));
  const moreButton = () => el().querySelector<HTMLButtonElement>('button.load-more');
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  async function create(selected: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [NutritionDaysListComponent],
      providers: [provideRouter([]), { provide: NutritionService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionDaysListComponent);
    fixture.componentRef.setInput('selected', selected);
    fixture.detectChanges();
    await settle();
  }

  beforeEach(() => {
    service = { listDaysBefore: vi.fn() };
  });

  it('loads the newest page first and labels today', async () => {
    service.listDaysBefore.mockResolvedValueOnce(page(0, DAYS_PAGE_SIZE));
    await create();

    expect(service.listDaysBefore).toHaveBeenCalledWith(null, DAYS_PAGE_SIZE);
    expect(rows().length).toBe(DAYS_PAGE_SIZE);
    const firstRow = rows()[0].textContent?.replace(/\s+/g, ' ');
    expect(firstRow).toContain('Today · Day 53');
    expect(firstRow).toContain('1460 kcal · 1 of 2 eaten');
    expect(rows()[0].getAttribute('href')).toBe(`/nutrition?day=${today}`);
  });

  it('loads older days after the last one and appends them', async () => {
    service.listDaysBefore
      .mockResolvedValueOnce(page(0, DAYS_PAGE_SIZE))
      .mockResolvedValueOnce(page(DAYS_PAGE_SIZE, 3));
    await create();

    moreButton()!.click();
    await settle();

    expect(service.listDaysBefore).toHaveBeenLastCalledWith(
      shiftDate(today, -(DAYS_PAGE_SIZE - 1)),
      DAYS_PAGE_SIZE,
    );
    expect(rows().length).toBe(DAYS_PAGE_SIZE + 3);
    expect(moreButton()).toBeNull();
    expect(text()).toContain('No older plans');
  });

  it('marks the selected day', async () => {
    service.listDaysBefore.mockResolvedValueOnce(page(0, 3));
    await create(shiftDate(today, -1));
    expect(rows()[1].classList).toContain('active');
    expect(rows()[0].classList).not.toContain('active');
  });

  it('reports the first page so the page can pick a default day', async () => {
    service.listDaysBefore.mockResolvedValueOnce(page(0, 2));
    const seen: TNutritionDay[][] = [];
    await TestBed.configureTestingModule({
      imports: [NutritionDaysListComponent],
      providers: [provideRouter([]), { provide: NutritionService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(NutritionDaysListComponent);
    fixture.componentRef.setInput('selected', null);
    fixture.componentInstance.firstPage.subscribe((d) => seen.push(d));
    fixture.detectChanges();
    await settle();
    expect(seen[0].map((d) => d.plan_date)).toEqual([today, shiftDate(today, -1)]);
  });

  it('updates a row when its day changes elsewhere', async () => {
    service.listDaysBefore.mockResolvedValueOnce(page(0, 1));
    await create();
    const changed = structuredClone(day(0));
    changed.meals = changed.meals.map((m) => ({ ...m, eaten_at: 'T' }));
    fixture.componentInstance.replaceDay(changed);
    fixture.detectChanges();
    expect(rows()[0].textContent).toContain('2 of 2 eaten');
  });

  it('shows an empty state when no plans are saved', async () => {
    service.listDaysBefore.mockResolvedValueOnce([]);
    await create();
    expect(text()).toContain('No plans yet. Send one to the Telegram bot.');
  });
});
