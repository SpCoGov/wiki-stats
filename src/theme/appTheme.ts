import { createTheme, type PaletteMode } from "@mui/material/styles";

export function createAppTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#8ab4f8" : "#3367d6",
      },
      secondary: {
        main: mode === "dark" ? "#78d9c4" : "#00796b",
      },
      background: {
        default: mode === "dark" ? "#111418" : "#f6f7f9",
        paper: mode === "dark" ? "#181c22" : "#ffffff",
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            colorScheme: mode,
            scrollbarColor: mode === "dark" ? "#5f6673 #181c22" : "#a9b0ba #f6f7f9",
          },
          "*": {
            scrollbarWidth: "thin",
          },
          "*::-webkit-scrollbar": {
            width: 10,
            height: 10,
          },
          "*::-webkit-scrollbar-track": {
            backgroundColor: mode === "dark" ? "#181c22" : "#f6f7f9",
          },
          "*::-webkit-scrollbar-thumb": {
            backgroundColor: mode === "dark" ? "#5f6673" : "#a9b0ba",
            borderRadius: 8,
            border: `2px solid ${mode === "dark" ? "#181c22" : "#f6f7f9"}`,
          },
          "*::-webkit-scrollbar-thumb:hover": {
            backgroundColor: mode === "dark" ? "#7a8392" : "#858e9a",
          },
          'input[type="number"]': {
            colorScheme: mode,
            MozAppearance: "textfield",
          },
          'input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button': {
            WebkitAppearance: "none",
            margin: 0,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
