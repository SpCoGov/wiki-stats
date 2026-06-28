export type ThemeMode = "light" | "dark" | "system";

export type DateRangePreset = "7d" | "30d" | "90d" | "all" | "custom";

export interface AppSettings {
  apiEndpoint: string;
  language: string;
  themeMode: ThemeMode;
}

export const defaultSettings: AppSettings = {
  apiEndpoint: "https://en.wikipedia.org/w/api.php",
  language: "zh-CN",
  themeMode: "system",
};
