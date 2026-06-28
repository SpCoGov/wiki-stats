import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import SettingsIcon from "@mui/icons-material/Settings";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AppLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const items = [
    { to: "/contributions", label: t("nav.contributions"), icon: <EditNoteIcon /> },
    { to: "/patrol", label: t("nav.patrol"), icon: <FactCheckIcon /> },
    { to: "/settings", label: t("nav.settings"), icon: <SettingsIcon /> },
  ];

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar position="fixed" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ gap: 3 }}>
          <Typography variant="h6" sx={{ flexShrink: 0 }}>
            {t("app.name")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ minWidth: 0, overflowX: "auto" }}>
            {items.map((item) => {
              const selected = location.pathname === item.to;
              return (
                <Tooltip key={item.to} title={item.label}>
                  <IconButton
                    component={NavLink}
                    to={item.to}
                    color={selected ? "primary" : "inherit"}
                    aria-label={item.label}
                    sx={{
                      flexShrink: 0,
                      bgcolor: selected ? "action.selected" : "transparent",
                      border: 1,
                      borderColor: selected ? "primary.main" : "transparent",
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
