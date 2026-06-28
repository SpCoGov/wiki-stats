import { useQuery } from "@tanstack/react-query";
import { fetchUserContributions } from "../api/revisions";
import { fetchUsersMeta } from "../api/users";
import { useSettings } from "../stores/settingsStore";
import type { ContributionFilters } from "../types/mediawiki";
import type { QueryProgress } from "../types/mediawiki";
import { getContributionStats } from "../utils/stats";

export function useContributions(
  filters: ContributionFilters,
  enabled: boolean,
  onProgress?: (progress: QueryProgress) => void,
) {
  const { settings } = useSettings();

  return useQuery({
    queryKey: ["contributions", settings.apiEndpoint, filters],
    queryFn: async ({ signal }) => {
      const records = await fetchUserContributions(settings.apiEndpoint, filters, signal, onProgress);
      if (!filters.userGroup?.trim() && !filters.userRight?.trim()) {
        return records;
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

      return records.filter((record) => {
        const meta = users.get(record.user);
        return (!group || meta?.groups?.includes(group)) && (!right || meta?.rights?.includes(right));
      });
    },
    enabled,
    staleTime: 60_000,
    select: (records) => ({
      records,
      stats: getContributionStats(records),
    }),
  });
}
