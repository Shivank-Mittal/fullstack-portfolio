import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { monthCells, todayIso } from '../nutrition.utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function shiftMonth(month: string, by: number): string {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + by, 1)).toISOString().slice(0, 7);
}

/** A month grid; days with a saved plan are marked and open that plan. */
@Component({
  selector: 'app-nutrition-month',
  imports: [RouterLink],
  templateUrl: './nutrition-month.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionMonthComponent {
  private readonly nutritionService = inject(NutritionService);

  protected readonly weekdays = WEEKDAYS;
  protected readonly today = todayIso();
  protected readonly month = signal(this.today.slice(0, 7));
  protected readonly cells = computed(() => monthCells(this.month()));
  protected readonly planDates = signal(new Set<string>());
  protected readonly monthLabel = computed(() =>
    new Date(`${this.month()}-01T00:00:00Z`).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric',
    }),
  );

  constructor() {
    effect(() => {
      const dates = this.cells().filter((c): c is string => c !== null);
      untracked(() => this.load(dates[0], dates.at(-1)!));
    });
  }

  protected step(by: number) {
    this.month.update((m) => shiftMonth(m, by));
  }

  private async load(from: string, to: string) {
    try {
      const days = await this.nutritionService.listDays(from, to);
      this.planDates.set(new Set(days.map((d) => d.plan_date)));
    } catch {
      this.planDates.set(new Set());
    }
  }
}
