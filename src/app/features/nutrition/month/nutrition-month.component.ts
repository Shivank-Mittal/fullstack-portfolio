import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TNutritionDay } from '../../../types/TNutrition';
import { monthCells, todayIso } from '../nutrition.utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function shiftMonth(month: string, by: number): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(year, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

@Component({
  selector: 'app-nutrition-month',
  imports: [RouterLink],
  templateUrl: './nutrition-month.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionMonthComponent {
  readonly days = input.required<TNutritionDay[]>();

  protected readonly weekdays = WEEKDAYS;
  protected readonly today = todayIso();
  protected readonly month = signal(this.today.slice(0, 7));
  protected readonly cells = computed(() => monthCells(this.month()));
  protected readonly planDates = computed(() => new Set(this.days().map((d) => d.plan_date)));
  protected readonly monthLabel = computed(() =>
    new Date(`${this.month()}-01T00:00:00Z`).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }),
  );

  protected step(by: number) {
    this.month.update((m) => shiftMonth(m, by));
  }
}
