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
import { barOption, lineOption, pieOption, type ChartPoint } from "./chartOptions";

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

export type ChartKind = "line" | "bar" | "pie";

export function SwitchableChart({
  title,
  points,
  defaultKind,
  unit,
  availableKinds = ["line", "bar", "pie"],
}: {
  title: string;
  points: ChartPoint[];
  defaultKind: ChartKind;
  unit?: string;
  availableKinds?: ChartKind[];
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<ChartKind>(defaultKind);

  const option =
    kind === "line" ? lineOption(points, unit) : kind === "bar" ? barOption(points, unit) : pieOption(points);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1">{title}</Typography>
          <FormControl size="small" sx={{ minWidth: 108 }}>
            <Select value={kind} onChange={(event) => setKind(event.target.value as ChartKind)}>
              {availableKinds.map((item) => (
                <MenuItem key={item} value={item}>
                  {t(`chartTypes.${item}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <BaseChartBody option={option} />
      </CardContent>
    </Card>
  );
}

function BaseChartBody({ option }: { option: EChartsOption }) {
  const theme = useTheme();

  return (
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
  );
}
