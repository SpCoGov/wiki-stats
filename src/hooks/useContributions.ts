import { useQuery } from "@tanstack/react-query";
import { fetchRecentContributionRecords, fetchUserContributions } from "../api/revisions";
import { fetchUsersMeta } from "../api/users";
import { useSettings } from "../stores/settingsStore";
import type { ContributionFilters } from "../types/mediawiki";
import type { QueryProgress } from "../types/mediawiki";
import { getContributionStats } from "../utils/stats";

function sortByUserActivity(records: Awaited<ReturnType<typeof fetchUserContributions>>) {
  const userCounts = new Map<string, number>();
  records.forEach((record) => {
    userCounts.set(record.user, (userCounts.get(record.user) ?? 0) + 1);
  });

  return [...records].sort((a, b) => {
    const countDiff = (userCounts.get(b.user) ?? 0) - (userCounts.get(a.user) ?? 0);
    if (countDiff !== 0) {
      return countDiff;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export function useContributions(
  filters: ContributionFilters,
  enabled: boolean,
  onProgress?: (progress: QueryProgress) => void,
) {
  const { settings } = useSettings();

  return useQuery({
    queryKey: ["contributions", settings.apiEndpoint, filters],
    queryFn: async ({ signal }) => {
      const hasUser = Boolean(filters.user?.trim() || filters.users?.length);
      const records = hasUser
        ? await fetchUserContributions(settings.apiEndpoint, filters, signal, onProgress)
        : await fetchRecentContributionRecords(settings.apiEndpoint, filters, signal, onProgress);
      if (!filters.userGroup?.trim() && !filters.userRight?.trim()) {
        return sortByUserActivity(records);
      }
      const userBatches = Math.max(1, Math.ceil(new Set(records.map((record) => record.user).filter(Boolean)).size / 50));
      onProgress?.({
        completedPages: 0,
        maxPages: userBatches,
        hasMore: false,
        phase: "userMeta",
        batchSize: 50,
      });

      const users = await fetchUsersMeta(
        settings.apiEndpoint,
        records.map((record) => record.user),
        signal,
        onProgress,
      );
      const group = filters.userGroup?.trim();
      const right = filters.userRight?.trim();

      return sortByUserActivity(records.filter((record) => {
        const meta = users.get(record.user);
        return (!group || meta?.groups?.includes(group)) && (!right || meta?.rights?.includes(right));
      }));
    },
    enabled,
    staleTime: 60_000,
    select: (records) => ({
      records,
      stats: getContributionStats(records),
    }),
  });
}
