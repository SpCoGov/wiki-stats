import dayjs from "dayjs";
import type {
  ContributionRecord,
  ContributionStats,
  PatrolRecord,
  PatrolStats,
} from "../types/mediawiki";

function countBy<T>(items: T[], getKey: (item: T) => string) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

function averageBy<T>(items: T[], getKey: (item: T) => string, getValue: (item: T) => number | undefined) {
  const map = new Map<string, number[]>();
  items.forEach((item) => {
    const value = getValue(item);
    if (value === undefined) {
      return;
    }
    const key = getKey(item);
    map.set(key, [...(map.get(key) ?? []), value]);
  });

  return [...map.entries()]
    .map(([label, values]) => ({ label, value: Math.round(average(values) ?? 0) }))
    .sort((a, b) => a.value - b.value);
}

function delayBucket(delayMs: number) {
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delayMs < minute) return "<1m";
  if (delayMs < 5 * minute) return "1-5m";
  if (delayMs < 30 * minute) return "5-30m";
  if (delayMs < hour) return "30-60m";
  if (delayMs < 6 * hour) return "1-6h";
  if (delayMs < day) return "6-24h";
  return ">24h";
}

export function getContributionStats(records: ContributionRecord[]): ContributionStats {
  const today = dayjs().format("YYYY-MM-DD");
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    value: 0,
  }));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({
    label,
    value: 0,
  }));

  records.forEach((record) => {
    const time = dayjs(record.timestamp);
    hourly[time.hour()].value += 1;
    weekdays[time.day()].value += 1;
  });

  const peakHour = [...hourly].sort((a, b) => b.value - a.value)[0]?.label ?? "-";

  return {
    totalEdits: records.length,
    todayEdits: records.filter((record) => dayjs(record.timestamp).format("YYYY-MM-DD") === today).length,
    daily: countBy(records, (record) => dayjs(record.timestamp).format("YYYY-MM-DD")).reverse(),
    hourly,
    weekday: weekdays,
    namespaces: countBy(records, (record) => record.namespaceName ?? String(record.namespace)),
    topPages: countBy(records, (record) => record.title).slice(0, 10),
    topUsers: countBy(records, (record) => record.user || "-").slice(0, 10),
    peakHour,
  };
}

export function getPatrolStats(records: PatrolRecord[]): PatrolStats {
  const today = dayjs().format("YYYY-MM-DD");
  const hourly = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    value: 0,
  }));
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({
    label,
    value: 0,
  }));

  records.forEach((record) => {
    const time = dayjs(record.timestamp);
    hourly[time.hour()].value += 1;
    weekdays[time.day()].value += 1;
  });

  const peakHour = [...hourly].sort((a, b) => b.value - a.value)[0]?.label ?? "-";
  const completeRecords = records.filter(
    (record): record is PatrolRecord & { patrolDelayMs: number } => record.patrolDelayMs !== undefined,
  );
  const delays = completeRecords.map((record) => record.patrolDelayMs);
  const fastest = [...completeRecords].sort((a, b) => a.patrolDelayMs - b.patrolDelayMs)[0];
  const slowest = [...completeRecords].sort((a, b) => b.patrolDelayMs - a.patrolDelayMs)[0];

  return {
    totalPatrols: records.length,
    todayPatrols: records.filter((record) => dayjs(record.timestamp).format("YYYY-MM-DD") === today).length,
    completeSpeedCount: completeRecords.length,
    averageDelayMs: average(delays),
    medianDelayMs: median(delays),
    fastest,
    slowest,
    daily: countBy(records, (record) => dayjs(record.timestamp).format("YYYY-MM-DD")).reverse(),
    hourly,
    weekday: weekdays,
    topPatrollers: countBy(records, (record) => record.patroller || "-").slice(0, 10),
    topPages: countBy(records, (record) => record.title || "-").slice(0, 10),
    delayDistribution: countBy(completeRecords, (record) => delayBucket(record.patrolDelayMs)),
    averageDelayByPatroller: averageBy(completeRecords, (record) => record.patroller || "-", (record) => record.patrolDelayMs).slice(0, 10),
    averageDelayByNamespace: averageBy(
      completeRecords,
      (record) => record.namespaceName ?? String(record.namespace ?? "-"),
      (record) => record.patrolDelayMs,
    ),
    averageDelayDaily: averageBy(
      completeRecords,
      (record) => dayjs(record.timestamp).format("YYYY-MM-DD"),
      (record) => record.patrolDelayMs,
    ).sort((a, b) => a.label.localeCompare(b.label)),
    peakHour,
  };
}
