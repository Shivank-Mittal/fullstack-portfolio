import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../../types/TNutrition';
import { shiftDate, todayIso, weekDates, weekSeries } from '../nutrition.utils';
import { weekChartOptions } from './week-chart-options';
import { NutritionWeekChartComponent } from './nutrition-week-chart.component';

const shortDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  });

/** Week by week: planned vs eaten calories and protein, as numbers and a chart. */
@Component({
  selector: 'app-nutrition-statistics',
  imports: [NutritionWeekChartComponent],
  templateUrl: './nutrition-statistics.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionStatisticsComponent {
  private readonly nutritionService = inject(NutritionService);

  /** Any date in the week shown first; defaults to today. */
  readonly anchor = input(todayIso());

  private readonly offsetWeeks = signal(0);
  private readonly days = signal<TNutritionDay[]>([]);
  protected readonly failed = signal(false);
  protected readonly date = computed(() => shiftDate(this.anchor(), this.offsetWeeks() * 7));
  protected readonly series = computed(() => weekSeries(this.days(), this.date()));
  protected readonly rangeLabel = computed(() => {
    const dates = this.series().dates;
    return `${shortDay(dates[0])} – ${shortDay(dates[6])}`;
  });
  protected readonly chartOptions = computed(() => weekChartOptions(this.series()));

  constructor() {
    effect(() => {
      const dates = weekDates(this.date());
      untracked(() => this.load(dates[0], dates[6]));
    });
  }

  protected step(by: number) {
    this.offsetWeeks.update((w) => w + by);
  }

  private async load(from: string, to: string) {
    try {
      this.days.set(await this.nutritionService.listDays(from, to));
      this.failed.set(false);
    } catch {
      this.days.set([]);
      this.failed.set(true);
    }
  }
}
