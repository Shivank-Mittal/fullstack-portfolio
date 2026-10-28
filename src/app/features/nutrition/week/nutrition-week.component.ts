import { Component, computed, input, signal } from '@angular/core';
import { TNutritionDay } from '../../../types/TNutrition';
import { shiftDate, todayIso, weekSeries } from '../nutrition.utils';
import { weekChartOptions } from './week-chart-options';
import { NutritionWeekChartComponent } from './nutrition-week-chart.component';

const shortDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  });

@Component({
  selector: 'app-nutrition-week',
  imports: [NutritionWeekChartComponent],
  templateUrl: './nutrition-week.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionWeekComponent {
  readonly days = input.required<TNutritionDay[]>();
  /** Any date in the week shown first; defaults to today. */
  readonly anchor = input(todayIso());

  private readonly offsetWeeks = signal(0);
  protected readonly date = computed(() => shiftDate(this.anchor(), this.offsetWeeks() * 7));
  protected readonly series = computed(() => weekSeries(this.days(), this.date()));
  protected readonly rangeLabel = computed(() => {
    const dates = this.series().dates;
    return `${shortDay(dates[0])} – ${shortDay(dates[6])}`;
  });
  protected readonly chartOptions = computed(() => weekChartOptions(this.series()));

  protected step(by: number) {
    this.offsetWeeks.update((w) => w + by);
  }
}
