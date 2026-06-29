import type {
  ContributionFilters,
  ContributionRecord,
  QueryProgress,
  RecentChange,
  UserContribution,
} from "../types/mediawiki";
import { queryMediaWikiMany } from "./mediaWikiClient";

interface UserContribsQuery {
  usercontribs?: UserContribution[];
}

interface RecentChangesQuery {
  recentchanges?: RecentChange[];
}

function normalizeEndpointBase(endpoint: string) {
  return endpoint.replace(/\/api\.php.*$/, "");
}

function buildDiffUrl(endpoint: string, title: string, revisionId: number, oldRevisionId?: number) {
  const base = normalizeEndpointBase(endpoint);
  const url = new URL(`${base}/index.php`);
  url.searchParams.set("title", title);
  url.searchParams.set("diff", String(revisionId));
  if (oldRevisionId) {
    url.searchParams.set("oldid", String(oldRevisionId));
  }
  return url.toString();
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function fetchUserContributions(
  endpoint: string,
  filters: ContributionFilters,
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const users = filters.users?.length
    ? [...new Set(filters.users.map((item) => item.trim()).filter(Boolean))]
    : filters.user?.trim()
      ? [filters.user.trim()]
      : [];
  const batches = chunk(users, 50);
  const pages = [];

  for (const [index, batch] of batches.entries()) {
    pages.push(
      ...(await queryMediaWikiMany<UserContribsQuery>(
        endpoint,
        {
          list: "usercontribs",
          ucuser: batch.join("|"),
          ucstart: filters.start,
          ucend: filters.end,
          ucnamespace: filters.namespace === "all" ? undefined : filters.namespace,
          ucshow:
            filters.minor === "minor" ? "minor" : filters.minor === "nonminor" ? "!minor" : undefined,
          uclimit: 500,
          ucprop: "ids|title|timestamp|comment|size|sizediff|flags|tags|user",
        },
        {
          continuationKeys: ["uccontinue"],
          maxPages: filters.limitPages ?? 3,
          onProgress: (progress) =>
            onProgress?.({
              ...progress,
              completedPages: index * (filters.limitPages ?? 3) + progress.completedPages,
              maxPages: batches.length * (filters.limitPages ?? 3),
            }),
        },
        signal,
      )),
    );
  }

  return pages.flatMap((page) =>
    (page.query?.usercontribs ?? []).map<ContributionRecord>((item) => ({
      id: item.revid,
      user: item.user ?? "",
      title: item.title,
      namespace: item.ns,
      timestamp: item.timestamp,
      comment: item.comment ?? "",
      revisionId: item.revid,
      oldRevisionId: item.parentid,
      size: item.size,
      sizeDiff: item.sizediff,
      isMinor: item.minor === "" || item.minor === true,
      isNew: item.new === "" || item.new === true,
      tags: item.tags ?? [],
      diffUrl: buildDiffUrl(endpoint, item.title, item.revid, item.parentid),
    })),
  );
}

export async function fetchRecentContributionRecords(
  endpoint: string,
  filters: ContributionFilters,
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const pages = await queryMediaWikiMany<RecentChangesQuery>(
    endpoint,
    {
      list: "recentchanges",
      rctype: "edit|new",
      rcstart: filters.start,
      rcend: filters.end,
      rcnamespace: filters.namespace === "all" ? undefined : filters.namespace,
      rcshow:
        filters.minor === "minor" ? "minor" : filters.minor === "nonminor" ? "!minor" : undefined,
      rclimit: 500,
      rcprop: "ids|title|timestamp|comment|sizes|flags|tags|user",
    },
    { continuationKeys: ["rccontinue"], maxPages: filters.limitPages ?? 3, onProgress },
    signal,
  );

  return pages.flatMap((page) =>
    (page.query?.recentchanges ?? [])
      .filter((item) => item.revid)
      .map<ContributionRecord>((item) => ({
        id: item.revid,
        user: item.user ?? "",
        title: item.title,
        namespace: item.ns,
        timestamp: item.timestamp,
        comment: item.comment ?? "",
        revisionId: item.revid,
        oldRevisionId: item.old_revid,
        size: item.newlen,
        sizeDiff:
          item.newlen !== undefined && item.oldlen !== undefined
            ? item.newlen - item.oldlen
            : undefined,
        isMinor: item.minor === "" || item.minor === true,
        isNew: item.new === "" || item.new === true,
        tags: item.tags ?? [],
        diffUrl: buildDiffUrl(endpoint, item.title, item.revid, item.old_revid),
      })),
  );
}
