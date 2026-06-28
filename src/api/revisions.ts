import type { ContributionFilters, ContributionRecord, QueryProgress, UserContribution } from "../types/mediawiki";
import { queryMediaWikiMany } from "./mediaWikiClient";

interface UserContribsQuery {
  usercontribs?: UserContribution[];
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

export async function fetchUserContributions(
  endpoint: string,
  filters: ContributionFilters,
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const pages = await queryMediaWikiMany<UserContribsQuery>(
    endpoint,
    {
      list: "usercontribs",
      ucuser: filters.user?.trim(),
      ucstart: filters.start,
      ucend: filters.end,
      ucnamespace: filters.namespace === "all" ? undefined : filters.namespace,
      ucshow:
        filters.minor === "minor" ? "minor" : filters.minor === "nonminor" ? "!minor" : undefined,
      uclimit: 500,
      ucprop: "ids|title|timestamp|comment|size|sizediff|flags|tags|user",
    },
    { continuationKeys: ["uccontinue"], maxPages: filters.limitPages ?? 3, onProgress },
    signal,
  );

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
