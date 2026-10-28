import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { NutritionService } from '../../service/nutrition/nutrition.service';
import { TNutritionDay } from '../../types/TNutrition';
import { NutritionDaysListComponent } from './days-list/nutrition-days-list.component';
import { NutritionMonthComponent } from './month/nutrition-month.component';
import { NutritionWeekComponent } from './week/nutrition-week.component';

type TNutritionView = 'days' | 'month' | 'week';
const VIEWS: TNutritionView[] = ['days', 'month', 'week'];

@Component({
  selector: 'app-nutrition',
  imports: [
    RouterLink,
    NutritionDaysListComponent,
    NutritionMonthComponent,
    NutritionWeekComponent,
  ],
  templateUrl: './nutrition.component.html',
  styleUrl: './nutrition-views.css',
})
export class NutritionComponent {
  private readonly nutritionService = inject(NutritionService);

  protected readonly tabs: { view: TNutritionView; label: string }[] = [
    { view: 'days', label: 'Days' },
    { view: 'month', label: 'Month' },
    { view: 'week', label: 'Week' },
  ];
  protected readonly view = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((params) => {
        const view = params.get('view') as TNutritionView;
        return VIEWS.includes(view) ? view : 'days';
      }),
    ),
    { initialValue: 'days' as TNutritionView },
  );
  protected readonly days = signal<TNutritionDay[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);

  constructor() {
    this.load();
  }

  private async load() {
    try {
      this.days.set(await this.nutritionService.listDays());
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
