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
import GitHubIcon from "@mui/icons-material/GitHub";
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
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(10px)",
          bgcolor: "background.paper",
        }}
      >
        <Toolbar sx={{ gap: 3, minHeight: 68 }}>
          <Typography variant="h6" sx={{ flexShrink: 0 }}>
            {t("app.name")}
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              minWidth: 0,
              overflowX: "auto",
              ml: "auto",
              p: 0.5,
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              bgcolor: "action.hover",
            }}
          >
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
                      width: 40,
                      height: 40,
                      bgcolor: selected ? "background.paper" : "transparent",
                      border: 1,
                      borderColor: selected ? "divider" : "transparent",
                      boxShadow: selected ? 1 : "none",
                      "&:hover": {
                        bgcolor: "background.paper",
                      },
                    }}
                  >
                    {item.icon}
                  </IconButton>
                </Tooltip>
              );
            })}
            <Tooltip title="GitHub">
              <IconButton
                component="a"
                href="https://github.com/SpCoGov/wiki-stats"
                target="_blank"
                rel="noreferrer"
                color="inherit"
                aria-label="GitHub"
                sx={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  border: 1,
                  borderColor: "transparent",
                  "&:hover": {
                    bgcolor: "background.paper",
                  },
                }}
              >
                <GitHubIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: { xs: 2, md: 3 }, maxWidth: 1680, mx: "auto" }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
