import type { EChartsOption } from "echarts";

export interface ChartPoint {
  label: string;
  value: number;
}

export function lineOption(points: ChartPoint[], unit?: string): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: unit ? (value) => `${value} ${unit}` : undefined,
    },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: { type: "category", data: points.map((point) => point.label) },
    yAxis: { type: "value", name: unit },
    series: [{ type: "line", smooth: true, areaStyle: {}, data: points.map((point) => point.value) }],
  };
}

export function barOption(points: ChartPoint[], unit?: string): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: unit ? (value) => `${value} ${unit}` : undefined,
    },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: { type: "category", data: points.map((point) => point.label) },
    yAxis: { type: "value", name: unit },
    series: [{ type: "bar", data: points.map((point) => point.value) }],
  };
}

export function pieOption(points: ChartPoint[]): EChartsOption {
  return {
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["42%", "70%"],
        data: points.map((point) => ({ name: point.label, value: point.value })),
      },
    ],
  };
}
