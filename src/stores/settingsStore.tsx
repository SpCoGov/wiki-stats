import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import i18n from "../i18n";
import { defaultSettings, type AppSettings } from "../types/settings";

const storageKey = "wiki-stats-settings";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): AppSettings {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return defaultSettings;
  }

  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      updateSettings: (patch) => {
        setSettings((current) => {
          const next = { ...current, ...patch };
          window.localStorage.setItem(storageKey, JSON.stringify(next));
          if (patch.language) {
            void i18n.changeLanguage(patch.language);
          }
          return next;
        });
      },
      resetSettings: () => {
        window.localStorage.setItem(storageKey, JSON.stringify(defaultSettings));
        void i18n.changeLanguage(defaultSettings.language);
        setSettings(defaultSettings);
      },
    }),
    [settings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside SettingsProvider");
  }
  return context;
}
