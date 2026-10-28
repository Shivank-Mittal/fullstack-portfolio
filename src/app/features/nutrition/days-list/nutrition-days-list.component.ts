import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../../types/TNutrition';
import { eatenCount, formatShortDate, todayIso } from '../nutrition.utils';

export const DAYS_PAGE_SIZE = 14;

/** A scrollable box of saved days that loads older pages as you reach its bottom. */
@Component({
  selector: 'app-nutrition-days-list',
  imports: [RouterLink],
  templateUrl: './nutrition-days-list.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionDaysListComponent {
  private readonly nutritionService = inject(NutritionService);

  /** The day shown beside the list; its row is highlighted. */
  readonly selected = input<string | null>(null);
  /** The first page, once loaded, so the page can choose which day to show. */
  readonly firstPage = output<TNutritionDay[]>();

  protected readonly days = signal<TNutritionDay[]>([]);
  protected readonly loading = signal(false);
  protected readonly done = signal(false);
  protected readonly failed = signal(false);
  protected readonly today = todayIso();
  protected readonly formatShortDate = formatShortDate;
  protected readonly eatenCount = eatenCount;

  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  constructor() {
    this.loadMore();

    // Load the next page when the bottom of the list scrolls into view (browser only). Watching
    // against the viewport covers both layouts: on desktop the box scrolls (and clips the
    // sentinel), on a phone the page itself scrolls.
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) this.loadMore();
      });
      const target = this.sentinel()?.nativeElement;
      if (target) observer.observe(target);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  async loadMore() {
    if (this.loading() || this.done()) return;
    this.loading.set(true);
    const isFirst = this.days().length === 0;
    try {
      const before = this.days().at(-1)?.plan_date ?? null;
      const page = await this.nutritionService.listDaysBefore(before, DAYS_PAGE_SIZE);
      this.days.update((days) => [...days, ...page]);
      if (page.length < DAYS_PAGE_SIZE) this.done.set(true);
      if (isFirst) this.firstPage.emit(page);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /** Keeps a row in step when its day changes elsewhere, e.g. a meal ticked in the plan. */
  replaceDay(day: TNutritionDay) {
    this.days.update((days) => days.map((d) => (d.plan_date === day.plan_date ? day : d)));
  }
}
