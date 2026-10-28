import { Component, input } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import type { EChartsCoreOption } from 'echarts/core';
import { BarChart, LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Only the pieces the week chart uses. This component is only referenced inside the week
// view's @defer block, so ECharts lands in its own lazily loaded chunk.
echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

@Component({
  selector: 'app-nutrition-week-chart',
  imports: [NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  template: `<div echarts class="week-chart" [options]="options()"></div>`,
  styles: `
    .week-chart {
      height: 320px;
      width: 100%;
    }
  `,
})
export class NutritionWeekChartComponent {
  readonly options = input.required<EChartsCoreOption>();
}
