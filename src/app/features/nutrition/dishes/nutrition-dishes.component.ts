import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { TDishAppearance, TDishStat } from '../../../types/TNutrition';
import { CATEGORY_LABELS, formatShortDate } from '../nutrition.utils';

type TDishSort = 'most' | 'az';

/**
 * The dish catalog: every dish from the plans, searchable by name. With `dish` set (from the
 * URL), it shows the days that dish was planned instead, each linking to that day's plan.
 */
@Component({
  selector: 'app-nutrition-dishes',
  imports: [RouterLink],
  templateUrl: './nutrition-dishes.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionDishesComponent {
  private readonly nutritionService = inject(NutritionService);

  /** The dish opened from the list, or null for the list itself. */
  readonly dish = input<string | null>(null);

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly formatShortDate = formatShortDate;

  private readonly dishes = signal<TDishStat[]>([]);
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly search = signal('');
  protected readonly sort = signal<TDishSort>('most');

  protected readonly hasDishes = computed(() => this.dishes().length > 0);
  // The whole catalog is loaded once; searching filters it as you type.
  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const matches = this.dishes().filter((d) => d.name.toLowerCase().includes(term));
    return this.sort() === 'az'
      ? [...matches].sort((a, b) => a.name.localeCompare(b.name))
      : [...matches].sort(
          (a, b) => b.days_planned - a.days_planned || a.name.localeCompare(b.name),
        );
  });

  protected readonly appearances = signal<TDishAppearance[]>([]);
  protected readonly appearancesLoading = signal(false);
  protected readonly daysPlanned = computed(
    () => new Set(this.appearances().map((a) => a.plan_date)).size,
  );
  protected readonly dishCategory = computed(() => this.appearances()[0]?.category ?? null);

  constructor() {
    this.loadDishes();
    effect(() => {
      const dish = this.dish();
      if (dish) untracked(() => this.loadAppearances(dish));
    });
  }

  protected onSearch(value: string) {
    this.search.set(value);
  }

  private async loadDishes() {
    try {
      this.dishes.set(await this.nutritionService.listDishes(''));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadAppearances(dish: string) {
    this.appearancesLoading.set(true);
    try {
      this.appearances.set(await this.nutritionService.getDishAppearances(dish));
    } catch {
      this.appearances.set([]);
    } finally {
      this.appearancesLoading.set(false);
    }
  }
}
