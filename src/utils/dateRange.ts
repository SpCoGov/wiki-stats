import dayjs from "dayjs";
import type { DateRangePreset } from "../types/settings";

export function resolveDateRange(preset: DateRangePreset) {
  if (preset === "all" || preset === "custom") {
    return { start: undefined, end: undefined };
  }

  const days = Number(preset.replace("d", ""));
  return {
    start: new Date().toISOString(),
    end: dayjs().subtract(days, "day").toISOString(),
  };
}

export function resolveQueryDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string,
) {
  if (preset !== "custom") {
    return resolveDateRange(preset);
  }

  return {
    start: customTo ? dayjs(customTo).endOf("day").toISOString() : undefined,
    end: customFrom ? dayjs(customFrom).startOf("day").toISOString() : undefined,
  };
}
