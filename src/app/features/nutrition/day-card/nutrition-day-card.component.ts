import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TNutritionDay } from '../../../types/TNutrition';
import { dayHeadline, eatenCount } from '../nutrition.utils';

/** A day's plan at a glance, with a link to its full page. Used beside the calendar's events. */
@Component({
  selector: 'app-nutrition-day-card',
  imports: [RouterLink],
  templateUrl: './nutrition-day-card.component.html',
  styleUrl: './nutrition-day-card.component.css',
})
export class NutritionDayCardComponent {
  readonly day = input.required<TNutritionDay>();

  protected readonly headline = computed(() => dayHeadline(this.day()));
  protected readonly eaten = computed(() => eatenCount(this.day().meals));
  protected readonly nextMeal = computed(() => this.day().meals.find((m) => !m.eaten_at) ?? null);
}
