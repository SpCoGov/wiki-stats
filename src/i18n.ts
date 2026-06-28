import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN.json";
import enUS from "./locales/en-US.json";
import jaJP from "./locales/ja-JP.json";
import { defaultSettings } from "./types/settings";

const saved = window.localStorage.getItem("wiki-stats-settings");
const language = saved ? JSON.parse(saved).language : defaultSettings.language;

i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    "en-US": { translation: enUS },
    "ja-JP": { translation: jaJP },
  },
  lng: language,
  fallbackLng: "zh-CN",
  interpolation: { escapeValue: false },
});

export default i18n;
