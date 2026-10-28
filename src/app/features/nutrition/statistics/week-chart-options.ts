import type { EChartsCoreOption } from 'echarts/core';
import { TWeekSeries } from '../../../types/TNutrition';

// Colours match the site's dark theme tokens in styles.css.
const TEXT = '#9ca3af';
const GRID = '#374151';
const PLANNED = '#6366f1';
const EATEN = '#22d3ee';
const PROTEIN = '#a78bfa';

/** Planned vs eaten calories as bars per day, protein as a line on its own axis. */
export function weekChartOptions(series: TWeekSeries): EChartsCoreOption {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: TEXT },
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { color: TEXT } },
    grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      data: series.labels,
      axisLine: { lineStyle: { color: GRID } },
    },
    yAxis: [
      { type: 'value', name: 'kcal', splitLine: { lineStyle: { color: GRID } } },
      { type: 'value', name: 'g', splitLine: { show: false } },
    ],
    series: [
      { name: 'Planned kcal', type: 'bar', data: series.planned, itemStyle: { color: PLANNED } },
      { name: 'Eaten kcal', type: 'bar', data: series.eaten, itemStyle: { color: EATEN } },
      {
        name: 'Protein g',
        type: 'line',
        yAxisIndex: 1,
        data: series.protein,
        connectNulls: false,
        itemStyle: { color: PROTEIN },
      },
    ],
  };
}
