import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { TNutritionDay } from '../../types/TNutrition';
import { todayIso } from './nutrition.utils';
import { NutritionDaysListComponent } from './days-list/nutrition-days-list.component';
import { NutritionDayComponent } from './day/nutrition-day.component';
import { NutritionMonthComponent } from './month/nutrition-month.component';
import { NutritionStatisticsComponent } from './statistics/nutrition-statistics.component';

type TNutritionView = 'plans' | 'month' | 'statistics';
const VIEWS: TNutritionView[] = ['plans', 'month', 'statistics'];

/**
 * /nutrition — Plans (days box beside the selected day's plan), Month and Statistics tabs.
 * The tab and the selected day live in query params (?view=…&day=…) so switching days keeps
 * the days box and its scroll position.
 */
@Component({
  selector: 'app-nutrition',
  imports: [
    RouterLink,
    NutritionDaysListComponent,
    NutritionDayComponent,
    NutritionMonthComponent,
    NutritionStatisticsComponent,
  ],
  templateUrl: './nutrition.component.html',
  styleUrl: './nutrition-views.css',
})
export class NutritionComponent {
  private readonly queryParams = inject(ActivatedRoute).queryParamMap;

  protected readonly tabs: { view: TNutritionView; label: string }[] = [
    { view: 'plans', label: 'Plans' },
    { view: 'month', label: 'Month' },
    { view: 'statistics', label: 'Statistics' },
  ];
  protected readonly view = toSignal(
    this.queryParams.pipe(
      map((params) => {
        const view = params.get('view') as TNutritionView;
        return VIEWS.includes(view) ? view : 'plans';
      }),
    ),
    { initialValue: 'plans' as TNutritionView },
  );
  /** The day picked in the URL; on a phone this is what switches from the list to the plan. */
  protected readonly dayParam = toSignal(this.queryParams.pipe(map((p) => p.get('day'))), {
    initialValue: null,
  });
  private readonly defaultDay = signal<string | null>(null);
  protected readonly selectedDay = computed(() => this.dayParam() ?? this.defaultDay());

  private readonly daysList = viewChild(NutritionDaysListComponent);

  /** Opens on today's plan, or the newest one when today has none. */
  protected onFirstPage(days: TNutritionDay[]) {
    const today = todayIso();
    this.defaultDay.set(
      days.find((d) => d.plan_date === today)?.plan_date ?? days[0]?.plan_date ?? null,
    );
  }

  protected onDayChange(day: TNutritionDay) {
    this.daysList()?.replaceDay(day);
  }
}
