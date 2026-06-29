import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SwitchableChart, type ChartKind } from "../charts/BaseChart";
import type { ChartPoint } from "../charts/chartOptions";

type ChartSize = "small" | "medium" | "large";
type ChartWidth = 4 | 6 | 8 | 12;

interface ChartLayoutItem {
  id: string;
  width: ChartWidth;
  size: ChartSize;
}

export interface DashboardChartDefinition {
  id: string;
  title: string;
  points: ChartPoint[];
  defaultKind: ChartKind;
  unit?: string;
  availableKinds: readonly ChartKind[];
  defaultWidth?: ChartWidth;
  defaultSize?: ChartSize;
}

const chartHeights: Record<ChartSize, number> = {
  small: 240,
  medium: 320,
  large: 440,
};

function defaultLayout(charts: DashboardChartDefinition[]): ChartLayoutItem[] {
  return charts.map((chart) => ({
    id: chart.id,
    width: chart.defaultWidth ?? 6,
    size: chart.defaultSize ?? "medium",
  }));
}

function readStoredLayout(storageKey: string, charts: DashboardChartDefinition[]) {
  const chartIds = new Set(charts.map((chart) => chart.id));
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "[]") as ChartLayoutItem[];
    const validItems = parsed.filter((item) => chartIds.has(item.id));
    const existingIds = new Set(validItems.map((item) => item.id));
    return [
      ...validItems,
      ...defaultLayout(charts).filter((item) => !existingIds.has(item.id)),
    ];
  } catch {
    return defaultLayout(charts);
  }
}

export function ChartDashboard({
  storageKey,
  charts,
}: {
  storageKey: string;
  charts: DashboardChartDefinition[];
}) {
  const { t } = useTranslation();
  const [layout, setLayout] = useState(() => readStoredLayout(storageKey, charts));
  const [draggedId, setDraggedId] = useState<string | undefined>();
  const latestDraggedId = useRef<string | undefined>(undefined);
  const chartMap = useMemo(
    () => new Map(charts.map((chart) => [chart.id, chart])),
    [charts],
  );
  const visibleIds = new Set(layout.map((item) => item.id));
  const hiddenCharts = charts.filter((chart) => !visibleIds.has(chart.id));

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(layout));
  }, [layout, storageKey]);

  function updateItem(id: string, patch: Partial<ChartLayoutItem>) {
    setLayout((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setLayout((items) => items.filter((item) => item.id !== id));
  }

  function addItem(id: string) {
    const chart = chartMap.get(id);
    if (!chart) {
      return;
    }
    setLayout((items) => [
      ...items,
      {
        id,
        width: chart.defaultWidth ?? 6,
        size: chart.defaultSize ?? "medium",
      },
    ]);
  }

  function moveItem(targetId: string, placement: "before" | "after") {
    const activeDraggedId = latestDraggedId.current;
    if (!activeDraggedId || activeDraggedId === targetId) {
      return;
    }
    setLayout((items) => {
      const dragged = items.find((item) => item.id === activeDraggedId);
      if (!dragged) {
        return items;
      }
      const withoutDragged = items.filter((item) => item.id !== activeDraggedId);
      const targetIndex = withoutDragged.findIndex((item) => item.id === targetId);
      if (targetIndex < 0) {
        return items;
      }
      const insertIndex = placement === "after" ? targetIndex + 1 : targetIndex;
      return [
        ...withoutDragged.slice(0, insertIndex),
        dragged,
        ...withoutDragged.slice(insertIndex),
      ];
    });
  }

  function movePreview(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const activeDraggedId = latestDraggedId.current;
    if (!activeDraggedId) {
      return;
    }

    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-chart-id]")]
      .filter((element) => element.dataset.chartId !== activeDraggedId)
      .map((element) => ({ element, rect: element.getBoundingClientRect() }));
    const hovered =
      items.find(({ rect }) =>
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom,
      ) ??
      items
        .map((item) => {
          const centerX = item.rect.left + item.rect.width / 2;
          const centerY = item.rect.top + item.rect.height / 2;
          return {
            ...item,
            distance: Math.hypot(event.clientX - centerX, event.clientY - centerY),
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

    const targetId = hovered?.element.dataset.chartId;
    if (!targetId) {
      return;
    }

    const rect = hovered.rect;
    const horizontal = rect.width > rect.height * 1.35;
    const midpoint = horizontal ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
    const pointer = horizontal ? event.clientX : event.clientY;
    moveItem(targetId, pointer > midpoint ? "after" : "before");
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>{t("dashboard.addChart")}</InputLabel>
          <Select
            value=""
            label={t("dashboard.addChart")}
            disabled={hiddenCharts.length === 0}
            onChange={(event) => addItem(event.target.value)}
          >
            {hiddenCharts.map((chart) => (
              <MenuItem key={chart.id} value={chart.id}>
                {chart.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RestartAltIcon />}
          onClick={() => setLayout(defaultLayout(charts))}
        >
          {t("dashboard.resetLayout")}
        </Button>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
        }}
        onDragOver={movePreview}
        onDrop={() => {
          latestDraggedId.current = undefined;
          setDraggedId(undefined);
        }}
      >
        {layout.map((item) => {
          const chart = chartMap.get(item.id);
          if (!chart) {
            return null;
          }

          return (
            <Box
              key={item.id}
              data-chart-id={item.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                latestDraggedId.current = item.id;
                setDraggedId(item.id);
              }}
              onDragEnd={() => {
                latestDraggedId.current = undefined;
                setDraggedId(undefined);
              }}
              sx={{
                gridColumn: { xs: "span 12", md: `span ${item.width}` },
                opacity: draggedId === item.id ? 0.55 : 1,
                outline: draggedId === item.id ? "2px dashed" : "2px solid transparent",
                outlineColor: draggedId === item.id ? "primary.main" : "transparent",
                outlineOffset: 4,
                transition: "transform 160ms ease, opacity 160ms ease, outline-color 160ms ease",
              }}
            >
              <SwitchableChart
                title={chart.title}
                points={chart.points}
                defaultKind={chart.defaultKind}
                unit={chart.unit}
                availableKinds={chart.availableKinds}
                height={chartHeights[item.size]}
                headerActions={
                  <>
                    <Tooltip title={t("dashboard.drag")}>
                      <DragIndicatorIcon
                        fontSize="small"
                        sx={{ color: "text.secondary", cursor: "grab" }}
                      />
                    </Tooltip>
                    <FormControl size="small" sx={{ minWidth: 84 }}>
                      <Select
                        value={item.width}
                        onChange={(event) =>
                          updateItem(item.id, { width: Number(event.target.value) as ChartWidth })
                        }
                      >
                        <MenuItem value={4}>{t("dashboard.widthSmall")}</MenuItem>
                        <MenuItem value={6}>{t("dashboard.widthMedium")}</MenuItem>
                        <MenuItem value={8}>{t("dashboard.widthWide")}</MenuItem>
                        <MenuItem value={12}>{t("dashboard.widthFull")}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 84 }}>
                      <Select
                        value={item.size}
                        onChange={(event) =>
                          updateItem(item.id, { size: event.target.value as ChartSize })
                        }
                      >
                        <MenuItem value="small">{t("dashboard.heightSmall")}</MenuItem>
                        <MenuItem value="medium">{t("dashboard.heightMedium")}</MenuItem>
                        <MenuItem value="large">{t("dashboard.heightLarge")}</MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip title={t("dashboard.remove")}>
                      <IconButton size="small" onClick={() => removeItem(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                }
              />
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}
