import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
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
import { useContributions } from "../hooks/useContributions";
import { useNamespaces } from "../hooks/useNamespaces";
import type { ContributionFilters } from "../types/mediawiki";
import type { DateRangePreset } from "../types/settings";
import { resolveQueryDateRange } from "../utils/dateRange";
import { downloadCsv } from "../utils/csv";
import { getContributionStats, getContributionTrend, type TrendGranularity } from "../utils/stats";

function namespaceLabel(namespaceId: number | undefined, namespaces?: Map<number, string>) {
  if (namespaceId === undefined) {
    return "-";
  }
  return namespaces?.get(namespaceId) ?? String(namespaceId);
}

const allChartKinds = ["line", "bar", "scatter", "radar", "pie"] as const;

export function ContributionsPage() {
  const { t } = useTranslation();
  const [user, setUser] = useState("");
  const [userGroup, setUserGroup] = useState("");
  const [userRight, setUserRight] = useState("");
  const [namespaces, setNamespaces] = useState<number[]>([]);
  const [minor, setMinor] = useState<"all" | "minor" | "nonminor">("all");
  const [limitPages, setLimitPages] = useState(3);
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [trendGranularity, setTrendGranularity] = useState<TrendGranularity>("day");
  const [filters, setFilters] = useState<ContributionFilters | undefined>();
  const [progress, setProgress] = useState({
    completedPages: 0,
    maxPages: 0,
    phase: "list",
    batchSize: 500,
  });

  const query = useContributions(filters ?? {}, Boolean(filters), (nextProgress) =>
    setProgress({
      completedPages: nextProgress.completedPages,
      maxPages: nextProgress.maxPages,
      phase: nextProgress.phase,
      batchSize: nextProgress.batchSize,
    }),
  );
  const namespaceQuery = useNamespaces(true);
  const records = useMemo(
    () =>
      (query.data?.records ?? []).map((record) => ({
        ...record,
        namespaceName: namespaceLabel(record.namespace, namespaceQuery.data),
      })),
    [namespaceQuery.data, query.data?.records],
  );
  const stats = useMemo(() => getContributionStats(records), [records]);
  const trend = useMemo(
    () => getContributionTrend(records, trendGranularity),
    [records, trendGranularity],
  );
  const chartDefinitions = useMemo<DashboardChartDefinition[]>(
    () => [
      {
        id: "editTrend",
        title: t("metrics.editTrend"),
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
        id: "namespace",
        title: t("charts.namespace"),
        points: stats?.namespaces ?? [],
        defaultKind: "pie",
        availableKinds: allChartKinds,
      },
      {
        id: "topEditedPages",
        title: t("charts.topEditedPages"),
        points: stats?.topPages ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
      {
        id: "topUsers",
        title: t("charts.topUsers"),
        points: stats?.topUsers ?? [],
        defaultKind: "bar",
        availableKinds: allChartKinds,
      },
    ],
    [stats, t, trend],
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "timestamp", headerName: t("contributions.columns.timestamp"), width: 180 },
      { field: "user", headerName: t("contributions.columns.user"), width: 150 },
      { field: "title", headerName: t("contributions.columns.title"), width: 240 },
      { field: "namespaceName", headerName: t("contributions.columns.namespace"), width: 150 },
      { field: "comment", headerName: t("contributions.columns.comment"), width: 320 },
      { field: "revisionId", headerName: t("contributions.columns.revisionId"), width: 130, type: "number" },
      { field: "oldRevisionId", headerName: t("contributions.columns.oldRevisionId"), width: 150, type: "number" },
      { field: "sizeDiff", headerName: t("contributions.columns.sizeDiff"), width: 120, type: "number" },
      { field: "isMinor", headerName: t("contributions.columns.isMinor"), width: 100, type: "boolean" },
      { field: "isNew", headerName: t("contributions.columns.isNew"), width: 100, type: "boolean" },
      {
        field: "tags",
        headerName: t("contributions.columns.tags"),
        width: 180,
        valueGetter: (value: string[] | undefined) => value?.join(", ") ?? "",
      },
      {
        field: "diffUrl",
        headerName: t("contributions.columns.diff"),
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button size="small" href={params.value} target="_blank" rel="noreferrer">
            {t("actions.openDiff")}
          </Button>
        ),
      },
    ],
    [t],
  );

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h4">{t("contributions.title")}</Typography>
        {!filters ? (
          <Typography variant="body2" color="text.secondary">
            {t("common.notQueried")}
          </Typography>
        ) : null}
      </Stack>
      <Card variant="outlined" sx={{ overflow: "hidden" }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack spacing={2.25}>
            <Typography variant="subtitle1">{t("contributions.filters")}</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  label={t("contributions.user")}
                  placeholder={t("contributions.userPlaceholder")}
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
                <FormControl fullWidth>
                  <InputLabel>{t("contributions.namespace")}</InputLabel>
                  <Select
                    multiple
                    value={namespaces}
                    label={t("contributions.namespace")}
                    renderValue={(selected) =>
                      selected.length === 0
                        ? t("common.all")
                        : selected.map((id) => namespaceLabel(id, namespaceQuery.data)).join(", ")
                    }
                    onChange={(event) => {
                      const value = event.target.value;
                      setNamespaces(typeof value === "string" ? value.split(",").map(Number) : value);
                    }}
                  >
                    {[...(namespaceQuery.data?.entries() ?? [])]
                      .sort(([left], [right]) => left - right)
                      .map(([id, name]) => (
                        <MenuItem key={id} value={id}>
                          <Checkbox checked={namespaces.includes(id)} />
                          <ListItemText primary={name} secondary={id} />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>{t("contributions.minor")}</InputLabel>
                  <Select value={minor} label={t("contributions.minor")} onChange={(event) => setMinor(event.target.value as typeof minor)}>
                    <MenuItem value="all">{t("common.all")}</MenuItem>
                    <MenuItem value="minor">{t("contributions.minorOnly")}</MenuItem>
                    <MenuItem value="nonminor">{t("contributions.nonMinorOnly")}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={t("contributions.pageLimit")}
                  value={limitPages}
                  slotProps={{ htmlInput: { min: 1, max: 10 } }}
                  onChange={(event) => setLimitPages(Number(event.target.value))}
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
                        namespaces,
                        minor,
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
          <MetricCard label={t("metrics.totalEdits")} value={stats?.totalEdits ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("metrics.todayEdits")} value={stats?.todayEdits ?? 0} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard label={t("contributions.peakHour")} value={stats?.peakHour ?? "-"} />
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
                  "wiki-contributions.csv",
                  records.map((record) => ({
                    timestamp: record.timestamp,
                    user: record.user,
                    title: record.title,
                    namespace: record.namespaceName ?? record.namespace,
                    comment: record.comment,
                    revisionId: record.revisionId,
                    oldRevisionId: record.oldRevisionId,
                    sizeDiff: record.sizeDiff,
                    isMinor: record.isMinor,
                    isNew: record.isNew,
                    tags: record.tags.join("|"),
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
      <ChartDashboard storageKey="wiki-stats.contributions.charts" charts={chartDefinitions} />
    </Stack>
  );
}
