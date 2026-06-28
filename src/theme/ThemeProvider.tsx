import { CssBaseline, ThemeProvider as MuiThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useSettings } from "../stores/settingsStore";
import { createAppTheme } from "./appTheme";

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const { settings } = useSettings();
  const mode = settings.themeMode === "system" ? (prefersDark ? "dark" : "light") : settings.themeMode;
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
