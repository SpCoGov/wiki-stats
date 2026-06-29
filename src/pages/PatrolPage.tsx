import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartDashboard, type DashboardChartDefinition } from "../components/ChartDashboard";
import { ErrorState } from "../components/ErrorState";
import { MetricCard } from "../components/MetricCard";
import { WikiDataGrid } from "../components/WikiDataGrid";
import { useNamespaces } from "../hooks/useNamespaces";
import { usePatrolLogs } from "../hooks/usePatrolLogs";
import type { PatrolFilters } from "../types/mediawiki";
import type { DateRangePreset } from "../types/settings";
import { resolveQueryDateRange } from "../utils/dateRange";
import { downloadCsv } from "../utils/csv";
import { formatDuration } from "../utils/format";
import { getPatrolStats, getPatrolTrend, type TrendGranularity } from "../utils/stats";

function namespaceLabel(namespaceId: number | undefined, namespaces?: Map<number, string>) {
  if (namespaceId === undefined) {
    return "-";
  }
  return namespaces?.get(namespaceId) ?? String(namespaceId);
}

const allChartKinds = ["line", "bar", "scatter", "radar", "pie"] as const;

export function PatrolPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState("");
  const [userGroup, setUserGroup] = useState("");
  const [userRight, setUserRight] = useState("");
  const [includeSpeed, setIncludeSpeed] = useState(true);
  const [title, setTitle] = useState("");
  const [limitPages, setLimitPages] = useState(3);
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("day");
  const [filters, setFilters] = useState<PatrolFilters | undefined>();
  const [progress, setProgress] = useState({
    completedPages: 0,
    maxPages: 0,
    phase: "list",
    batchSize: 500,
  });

  const query = usePatrolLogs(filters ?? {}, Boolean(filters), (nextProgress) =>
    setProgress({
      completedPages: nextProgress.completedPages,
      maxPages: nextProgress.maxPages,
      phase: nextProgress.phase,
      batchSize: nextProgress.batchSize,
    }),
  );
  const namespaceQuery = useNamespaces(Boolean(filters));
  const records = useMemo(
    () =>
      (query.data?.records ?? []).map((record) => ({
        ...record,
        namespaceName: namespaceLabel(record.namespace, namespaceQuery.data),
      })),
    [namespaceQuery.data, query.data?.records],
  );
  const stats = useMemo(() => getPatrolStats(records), [records]);
  const trend = useMemo(() => getPatrolTrend(records, trendGranularity), [records, trendGranularity]);
  const chartDefinitions = useMemo<DashboardChartDefinition[]>(
    () => [
      {
        id: "patrolTrend",
        title: t("metrics.patrolTrend"),
        points: trend,
        defaultKind: "line",
        availableKinds: allChartKinds,
      },
      {
        id: "hourly",
        title: t("charts.hourly"),
        points: stats?.hourly ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "weekday",
        title: t("charts.weekday"),
        points: stats?.weekday ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "topUsers",
        title: t("charts.topUsers"),
        points: stats?.topPatrollers ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "topPatrolledPages",
        title: t("charts.topPatrolledPages"),
        points: stats?.topPages ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "speedDistribution",
        title: t("charts.speedDistribution"),
        points: stats?.delayDistribution ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "averageSpeedTrend",
        title: t("charts.averageSpeedTrend"),
        points: (stats?.averageDelayDaily ?? []).map((point) => ({
          ...point,
          value: Math.round(point.value / 1000 / 60),
        })),
        defaultKind: "line",
        unit: t("units.minutes"),
        availableKinds: allChartKinds,
      },
      {
        id: "averageSpeedByUser",
        title: t("charts.averageSpeedByUser"),
        points: (stats?.averageDelayByPatroller ?? []).map((point) => ({
          ...point,
          value: Math.round(point.value / 1000 / 60),
        })),
        defaultKind: "bar",
        unit: t("units.minutes"),
        availableKinds: allChartKinds,
      },
      {
        id: "averageSpeedByNamespace",
        title: t("charts.averageSpeedByNamespace"),
        points: (stats?.averageDelayByNamespace ?? []).map((point) => ({
          ...point,
          value: Math.round(point.value / 1000 / 60),
        })),
        defaultKind: "bar",
        unit: t("units.minutes"),
        availableKinds: allChartKinds,
      },
    ],
    [stats, t, trend],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "timestamp", headerName: t("patrol.columns.timestamp"), width: 180 },
      { field: "patroller", headerName: t("patrol.columns.patroller"), width: 160 },
      { field: "revisionId", headerName: t("patrol.columns.revisionId"), width: 170, type: "number" },
      { field: "oldRevisionId", headerName: t("patrol.columns.oldRevisionId"), width: 140, type: "number" },
      { field: "revisionTimestamp", headerName: t("patrol.columns.revisionTimestamp"), width: 180 },
      { field: "revisionUser", headerName: t("patrol.columns.revisionUser"), width: 160 },
      {
        field: "patrolDelayMs",
        headerName: t("patrol.columns.patrolDelay"),
        width: 130,
        valueGetter: (value: number | undefined) => formatDuration(value),
      },
      { field: "title", headerName: t("patrol.columns.title"), width: 260 },
      { field: "namespaceName", headerName: t("patrol.columns.namespace"), width: 150 },
      { field: "action", headerName: t("patrol.columns.action"), width: 130 },
      { field: "comment", headerName: t("patrol.columns.comment"), width: 260 },
      {
        field: "incomplete",
        headerName: t("patrol.columns.incomplete"),
        width: 140,
        valueGetter: (value: boolean | undefined) => (value ? t("patrol.incomplete") : ""),
      },
      {
        field: "diffUrl",
        headerName: t("patrol.columns.diff"),
        width: 120,
        sortable: false,
        renderCell: (params) =>
          params.value ? (
            <Button size="small" href={params.value} target="_blank" rel="noreferrer">
              {t("actions.openDiff")}
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [t],
  );

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4">{t("patrol.title")}</Typography>
        {!filters ? (
          <Typography variant="body2" color="text.secondary">
            {t("common.notQueried")}
          </Typography>
        ) : null}
      </Stack>
      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={2.25}>
            <Typography variant="subtitle1">{t("patrol.filters")}</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={t("patrol.user")}
                  placeholder={t("patrol.userPlaceholder")}
                  value={user}
                  onChange={(event) => setUser(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label={t("filters.userGroup")}
                  placeholder={t("filters.userGroupPlaceholder")}
                  value={userGroup}
                  onChange={(event) => setUserGroup(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  label={t("filters.userRight")}
                  placeholder={t("filters.userRightPlaceholder")}
                  value={userRight}
                  onChange={(event) => setUserRight(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={t("patrol.titleFilter")}
                  placeholder={t("patrol.titlePlaceholder")}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>{t("dateRange.label")}</InputLabel>
                  <Select
                    value={dateRange}
                    label={t("dateRange.label")}
                    onChange={(event) => setDateRange(event.target.value as DateRangePreset)}
                  >
                    <MenuItem value="7d">{t("dateRange.7d")}</MenuItem>
                    <MenuItem value="30d">{t("dateRange.30d")}</MenuItem>
                    <MenuItem value="90d">{t("dateRange.90d")}</MenuItem>
                    <MenuItem value="all">{t("dateRange.all")}</MenuItem>
                    <MenuItem value="custom">{t("dateRange.custom")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {dateRange === "custom" ? (
                <>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={t("dateRange.from")}
                      value={dateFrom}
                      slotProps={{ inputLabel: { shrink: true } }}
                      onChange={(event) => setDateFrom(event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label={t("dateRange.to")}
                      value={dateTo}
                      slotProps={{ inputLabel: { shrink: true } }}
                      onChange={(event) => setDateTo(event.target.value)}
                    />
                  </Grid>
                </>
              ) : null}
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t("patrol.pageLimit")}
                  value={limitPages}
                  slotProps={{ htmlInput: { min: 1, max: 10 } }}
                  onChange={(event) => setLimitPages(Number(event.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={includeSpeed}
                      onChange={(event) => setIncludeSpeed(event.target.checked)}
                    />
                  }
                  label={t("patrol.includeSpeed")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={query.isFetching ? <CircularProgress color="inherit" size={18} /> : <SearchIcon />}
                  sx={{ minHeight: 40 }}
                  onClick={() =>
                    {
                      setProgress({ completedPages: 0, maxPages: limitPages, phase: "list", batchSize: 500 });
                      setFilters({
                        ...resolveQueryDateRange(dateRange, dateFrom, dateTo),
                        user,
                        userGroup,
                        userRight,
                        includeSpeed,
                        title,
                        limitPages,
                      });
                    }
                  }
                >
                  {t("actions.search")}
                </Button>
              </Grid>
            </Grid>
          </Stack>
          {query.isFetching ? (
            <Stack spacing={1}>
              <LinearProgress
                variant="determinate"
                value={
                  progress.maxPages > 0
                    ? Math.min(100, (progress.completedPages / progress.maxPages) * 100)
                    : 0
                }
              />
              <Typography variant="caption" color="text.secondary">
                {t("filters.batchProgress", {
                  completed: progress.completedPages,
                  total: progress.maxPages || limitPages,
                  batchSize: progress.batchSize,
                })}{" "}
                · {t(`filters.phase${progress.phase === "list" ? "List" : progress.phase === "revisionDetails" ? "RevisionDetails" : "UserMeta"}`)}
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>
      {query.error ? <ErrorState error={query.error} /> : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("metrics.totalPatrols")} value={stats?.totalPatrols ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("metrics.todayPatrols")} value={stats?.todayPatrols ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.peakHour")} value={stats?.peakHour ?? "-"} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.averageDelay")} value={formatDuration(stats?.averageDelayMs)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.medianDelay")} value={formatDuration(stats?.medianDelayMs)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.fastest")} value={formatDuration(stats?.fastest?.patrolDelayMs)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.slowest")} value={formatDuration(stats?.slowest?.patrolDelayMs)} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("patrol.completeSpeedCount")} value={stats?.completeSpeedCount ?? 0} />
        </Grid>
      </Grid>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              disabled={records.length === 0}
              onClick={() =>
                downloadCsv(
                  "wiki-patrol-logs.csv",
                  records.map((record) => ({
                    patrolTimestamp: record.timestamp,
                    patroller: record.patroller,
                    revisionId: record.revisionId,
                    oldRevisionId: record.oldRevisionId,
                    revisionTimestamp: record.revisionTimestamp,
                    revisionUser: record.revisionUser,
                    patrolDelay: formatDuration(record.patrolDelayMs),
                    title: record.title,
                    namespace: record.namespaceName ?? record.namespace,
                    action: record.action,
                    comment: record.comment,
                    incomplete: record.incomplete,
                    diffUrl: record.diffUrl,
                  })),
                )
              }
            >
              {t("actions.exportCsv")}
            </Button>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>{t("charts.trendGranularity")}</InputLabel>
              <Select
                value={trendGranularity}
                label={t("charts.trendGranularity")}
                onChange={(event) => setTrendGranularity(event.target.value as TrendGranularity)}
              >
                <MenuItem value="day">{t("charts.day")}</MenuItem>
                <MenuItem value="week">{t("charts.week")}</MenuItem>
                <MenuItem value="month">{t("charts.month")}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Box sx={{ height: 560 }}>
            <WikiDataGrid
              rows={records}
              columns={columns}
              loading={query.isLoading || query.isFetching}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>
      <ChartDashboard storageKey="wiki-stats.patrol.charts" charts={chartDefinitions} />
    </Stack>
  );
}
