import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NutritionService } from '../../../service/nutrition/nutrition.service';
import { ToastService } from '../../../service/toast-service/toast.service';
import { TNutritionDay, TNutritionMeal } from '../../../types/TNutrition';
import { dayHeadline, eatenCalories, formatShortDate } from '../nutrition.utils';

/** One day's whole plan: every meal with its items, quantities and an eaten checkbox. */
@Component({
  selector: 'app-nutrition-day',
  imports: [RouterLink],
  templateUrl: './nutrition-day.component.html',
  styleUrl: './nutrition-day.component.css',
})
export class NutritionDayComponent {
  private readonly nutritionService = inject(NutritionService);
  private readonly toastService = inject(ToastService);

  readonly date = input.required<string>();
  /** Emits the day after a meal's eaten state is saved, so lists can stay in step. */
  readonly dayChange = output<TNutritionDay>();

  protected readonly day = signal<TNutritionDay | null>(null);
  protected readonly neighbours = signal<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  });
  protected readonly loading = signal(true);

  protected readonly headline = computed(() => {
    const day = this.day();
    return day ? dayHeadline(day) : 'Nutrition plan';
  });
  protected readonly dateLabel = computed(() => formatShortDate(this.date()));
  protected readonly eaten = computed(() => eatenCalories(this.day()?.meals ?? []));
  protected readonly progress = computed(() => {
    const total = this.day()?.calories ?? 0;
    return total ? Math.min(100, Math.round((this.eaten() / total) * 100)) : 0;
  });

  constructor() {
    effect(() => {
      const date = this.date();
      untracked(() => this.load(date));
    });
  }

  protected async toggle(meal: TNutritionMeal, checkbox: HTMLInputElement) {
    const eaten = checkbox.checked;
    const previous = meal.eaten_at;
    this.setMealEaten(meal.id, eaten ? new Date().toISOString() : null);
    try {
      this.setMealEaten(meal.id, await this.nutritionService.setEaten(meal.id, eaten));
      const day = this.day();
      if (day) this.dayChange.emit(day);
    } catch {
      this.setMealEaten(meal.id, previous);
      // A fast failure can land before change detection runs, so the [checked] binding never
      // changes and would leave the box ticked; reset the element itself.
      checkbox.checked = !!previous;
      this.toastService.error("Couldn't save, try again");
    }
  }

  private setMealEaten(mealId: string, eatenAt: string | null) {
    this.day.update((day) =>
      day
        ? {
            ...day,
            meals: day.meals.map((m) => (m.id === mealId ? { ...m, eaten_at: eatenAt } : m)),
          }
        : day,
    );
  }

  private async load(date: string) {
    this.loading.set(true);
    try {
      const [day, neighbours] = await Promise.all([
        this.nutritionService.getDay(date),
        this.nutritionService.getNeighbours(date),
      ]);
      this.day.set(day);
      this.neighbours.set(neighbours);
    } catch {
      this.day.set(null);
      this.toastService.error("Couldn't load this plan");
    } finally {
      this.loading.set(false);
    }
  }
}
