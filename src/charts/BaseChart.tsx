import {
  Box,
  Card,
  CardContent,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { barOption, lineOption, pieOption, radarOption, scatterOption, type ChartPoint } from "./chartOptions";

export function BaseChart({ title, option }: { title: string; option: EChartsOption }) {
  const theme = useTheme();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Box sx={{ height: 300 }}>
          <ReactECharts
            option={{
              backgroundColor: "transparent",
              textStyle: { color: theme.palette.text.primary },
              ...option,
            }}
            theme={theme.palette.mode}
            style={{ height: "100%", width: "100%" }}
            notMerge
          />
        </Box>
      </CardContent>
    </Card>
  );
}

export type ChartKind = "line" | "bar" | "pie" | "scatter" | "radar";

export function SwitchableChart({
  title,
  points,
  defaultKind,
  unit,
  availableKinds = ["line", "bar", "pie"],
  height = 300,
  headerActions,
}: {
  title: string;
  points: ChartPoint[];
  defaultKind: ChartKind;
  unit?: string;
  availableKinds?: readonly ChartKind[];
  height?: number;
  headerActions?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ChartKind>(defaultKind);
  const [logScale, setLogScale] = useState(false);

  const option =
    kind === "line"
      ? lineOption(points, unit, logScale)
      : kind === "bar"
        ? barOption(points, unit, logScale)
        : kind === "scatter"
          ? scatterOption(points, unit, logScale)
          : kind === "radar"
            ? radarOption(points, unit)
            : pieOption(points);
  const canUseLogScale = kind === "line" || kind === "bar" || kind === "scatter";

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1, gap: 1 }}>
          <Typography variant="subtitle1">{title}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {headerActions}
            <FormControl size="small" sx={{ minWidth: 108 }}>
              <Select value={kind} onChange={(event) => setKind(event.target.value as ChartKind)}>
                {availableKinds.map((item) => (
                  <MenuItem key={item} value={item}>
                    {t(`chartTypes.${item}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {canUseLogScale ? (
              <FormControl size="small" sx={{ minWidth: 92 }}>
                <Select
                  value={logScale ? "log" : "linear"}
                  onChange={(event) => setLogScale(event.target.value === "log")}
                >
                  <MenuItem value="linear">{t("scaleTypes.linear")}</MenuItem>
                  <MenuItem value="log">{t("scaleTypes.log")}</MenuItem>
                </Select>
              </FormControl>
            ) : null}
          </Stack>
        </Stack>
        <BaseChartBody option={option} height={height} />
      </CardContent>
    </Card>
  );
}

function BaseChartBody({ option, height = 300 }: { option: EChartsOption; height?: number }) {
  const theme = useTheme();

  return (
    <Box sx={{ height }}>
      <ReactECharts
        option={{
          backgroundColor: "transparent",
          textStyle: { color: theme.palette.text.primary },
          ...option,
        }}
        theme={theme.palette.mode}
        style={{ height: "100%", width: "100%" }}
        notMerge
      />
    </Box>
  );
}
