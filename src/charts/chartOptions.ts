import type { EChartsOption } from "echarts";

export interface ChartPoint {
  label: string;
  value: number;
}

function valueAxis(unit?: string, logScale?: boolean) {
  return logScale ? {
    type: "log" as const,
    name: unit,
    logBase: 10,
    min: 1,
  } : {
    type: "value" as const,
    name: unit,
  };
}

function safeValues(points: ChartPoint[], logScale?: boolean) {
  return points.map((point) => (logScale ? Math.max(1, point.value) : point.value));
}

export function lineOption(points: ChartPoint[], unit?: string, logScale?: boolean): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: unit ? (value) => `${value} ${unit}` : undefined,
    },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: { type: "category", data: points.map((point) => point.label) },
    yAxis: valueAxis(unit, logScale),
    series: [{ type: "line", smooth: true, areaStyle: {}, data: safeValues(points, logScale) }],
  };
}

export function barOption(points: ChartPoint[], unit?: string, logScale?: boolean): EChartsOption {
  return {
    tooltip: {
      trigger: "axis",
      valueFormatter: unit ? (value) => `${value} ${unit}` : undefined,
    },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: { type: "category", data: points.map((point) => point.label) },
    yAxis: valueAxis(unit, logScale),
    series: [{ type: "bar", data: safeValues(points, logScale) }],
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

export function scatterOption(points: ChartPoint[], unit?: string, logScale?: boolean): EChartsOption {
  return {
    tooltip: {
      trigger: "item",
      valueFormatter: unit ? (value) => `${value} ${unit}` : undefined,
    },
    grid: { left: 40, right: 20, top: 24, bottom: 40 },
    xAxis: { type: "category", data: points.map((point) => point.label) },
    yAxis: valueAxis(unit, logScale),
    series: [{ type: "scatter", symbolSize: 12, data: safeValues(points, logScale) }],
  };
}

export function radarOption(points: ChartPoint[], unit?: string): EChartsOption {
  const visiblePoints = points.slice(0, 12);
  return {
    tooltip: {
      trigger: "item",
      formatter: () =>
        visiblePoints
          .map((point) => `${point.label}: ${point.value}${unit ? ` ${unit}` : ""}`)
          .join("<br/>"),
    },
    radar: {
      indicator: visiblePoints.map((point) => ({
        name: point.label,
        max: Math.max(1, point.value),
      })),
      radius: "65%",
    },
    series: [
      {
        type: "radar",
        areaStyle: {},
        data: [{ value: visiblePoints.map((point) => point.value) }],
      },
    ],
  };
}
