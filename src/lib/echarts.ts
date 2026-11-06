"use client";

import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart, TreemapChart, RadarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  GraphicComponent,
  RadarComponent,
  AriaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  TreemapChart,
  RadarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  GraphicComponent,
  RadarComponent,
  AriaComponent,
  CanvasRenderer,
]);

export { echarts };
export type EChartsOption = echarts.EChartsCoreOption;
