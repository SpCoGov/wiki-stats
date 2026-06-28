import SaveIcon from "@mui/icons-material/Save";
import {
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../stores/settingsStore";
import type { AppSettings, ThemeMode } from "../types/settings";

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);

  return (
    <Stack spacing={3}>
      <Typography variant="h4">{t("settings.title")}</Typography>
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t("settings.apiEndpoint")}
                value={draft.apiEndpoint}
                onChange={(event) => setDraft({ ...draft, apiEndpoint: event.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t("settings.language")}</InputLabel>
                <Select
                  value={draft.language}
                  label={t("settings.language")}
                  onChange={(event) => setDraft({ ...draft, language: event.target.value })}
                >
                  <MenuItem value="zh-CN">zh-CN</MenuItem>
                  <MenuItem value="en-US">en-US</MenuItem>
                  <MenuItem value="ja-JP">ja-JP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>{t("settings.themeMode")}</InputLabel>
                <Select
                  value={draft.themeMode}
                  label={t("settings.themeMode")}
                  onChange={(event) => setDraft({ ...draft, themeMode: event.target.value as ThemeMode })}
                >
                  <MenuItem value="light">{t("settings.light")}</MenuItem>
                  <MenuItem value="dark">{t("settings.dark")}</MenuItem>
                  <MenuItem value="system">{t("settings.system")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{ mt: 3 }}
            onClick={() => {
              updateSettings(draft);
              setSaved(true);
            }}
          >
            {t("actions.save")}
          </Button>
        </CardContent>
      </Card>
      <Snackbar open={saved} autoHideDuration={2000} onClose={() => setSaved(false)} message={t("settings.saved")} />
    </Stack>
  );
}
