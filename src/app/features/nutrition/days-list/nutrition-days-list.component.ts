import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TNutritionDay } from '../../../types/TNutrition';
import { eatenCount, formatShortDate } from '../nutrition.utils';

@Component({
  selector: 'app-nutrition-days-list',
  imports: [RouterLink],
  templateUrl: './nutrition-days-list.component.html',
  styleUrl: '../nutrition-views.css',
})
export class NutritionDaysListComponent {
  readonly days = input.required<TNutritionDay[]>();

  protected readonly formatShortDate = formatShortDate;
  protected readonly eatenCount = eatenCount;
}
