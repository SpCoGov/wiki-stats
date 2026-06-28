import type { PatrolFilters, PatrolLogEvent, PatrolRecord, QueryProgress } from "../types/mediawiki";
import { queryMediaWiki, queryMediaWikiMany } from "./mediaWikiClient";

interface PatrolLogsQuery {
  logevents?: PatrolLogEvent[];
}

interface RevisionInfo {
  revid: number;
  parentid?: number;
  user?: string;
  timestamp?: string;
}

interface RevisionPage {
  ns?: number;
  title?: string;
  revisions?: RevisionInfo[];
}

interface RevisionsQuery {
  pages?: Record<string, RevisionPage>;
}

function normalizeEndpointBase(endpoint: string) {
  return endpoint.replace(/\/api\.php.*$/, "");
}

function numericParam(params: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = params[key];
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value)) {
      return Number(value);
    }
  }
  return undefined;
}

function buildDiffUrl(endpoint: string, title: string, revisionId?: number, oldRevisionId?: number) {
  if (!revisionId) {
    return undefined;
  }
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

async function fetchRevisionDetails(
  endpoint: string,
  revisionIds: number[],
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const uniqueIds = [...new Set(revisionIds)];
  const revisions = new Map<number, RevisionPage & RevisionInfo>();
  const batches = chunk(uniqueIds, 50);

  for (const [index, ids] of batches.entries()) {
    const response = await queryMediaWiki<RevisionsQuery>(
      endpoint,
      {
        prop: "revisions",
        revids: ids.join("|"),
        rvprop: "ids|timestamp|user",
      },
      signal,
    );

    Object.values(response.query?.pages ?? {}).forEach((page) => {
      page.revisions?.forEach((revision) => {
        revisions.set(revision.revid, { ...page, ...revision });
      });
    });

    onProgress?.({
      completedPages: index + 1,
      maxPages: batches.length,
      hasMore: index + 1 < batches.length,
      phase: "revisionDetails",
      batchSize: 50,
    });
  }

  return revisions;
}

export async function fetchPatrolLogs(
  endpoint: string,
  filters: PatrolFilters,
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const pages = await queryMediaWikiMany<PatrolLogsQuery>(
    endpoint,
    {
      list: "logevents",
      letype: "patrol",
      leuser: filters.user?.trim(),
      letitle: filters.title?.trim(),
      lestart: filters.start,
      leend: filters.end,
      lelimit: 500,
      leprop: "ids|title|type|user|timestamp|comment|details",
    },
    { continuationKeys: ["lecontinue"], maxPages: filters.limitPages ?? 3, onProgress },
    signal,
  );

  const records = pages.flatMap((page) =>
    (page.query?.logevents ?? []).map<PatrolRecord>((event) => {
      const params = event.params ?? {};
      const revisionId = numericParam(params, ["revid", "rev_id", "curid", "curId", "newid"]);
      const oldRevisionId = numericParam(params, ["oldid", "old_id", "previd", "prev"]);
      const title = event.title ?? "";

      return {
        id: event.logid,
        timestamp: event.timestamp,
        patroller: event.user ?? "",
        revisionId,
        oldRevisionId,
        revisionTimestamp: undefined,
        revisionUser: undefined,
        title,
        namespace: event.ns,
        action: event.action ?? event.type ?? "patrol",
        comment: event.comment ?? "",
        diffUrl: buildDiffUrl(endpoint, title, revisionId, oldRevisionId),
        patrolDelayMs: undefined,
        rawParams: params,
        incomplete: !revisionId || !title,
      };
    }),
  );

  const revisionIds = records
    .map((record) => record.revisionId)
    .filter((revisionId): revisionId is number => Boolean(revisionId));
  const revisionBatches = Math.max(1, Math.ceil(new Set(revisionIds).size / 50));
  onProgress?.({
    completedPages: 0,
    maxPages: revisionBatches,
    hasMore: revisionBatches > 0,
    phase: "revisionDetails",
    batchSize: 50,
  });
  const revisionDetails = await fetchRevisionDetails(endpoint, revisionIds, signal, onProgress);

  return records.map((record) => {
    const revision = record.revisionId ? revisionDetails.get(record.revisionId) : undefined;
    const revisionTimestamp = revision?.timestamp;
    const revisionTitle = revision?.title ?? record.title;
    const revisionNamespace = revision?.ns ?? record.namespace;
    const patrolDelayMs = revisionTimestamp
      ? new Date(record.timestamp).getTime() - new Date(revisionTimestamp).getTime()
      : undefined;

    return {
      ...record,
      title: revisionTitle,
      namespace: revisionNamespace,
      oldRevisionId: revision?.parentid ?? record.oldRevisionId,
      revisionTimestamp,
      revisionUser: revision?.user,
      patrolDelayMs: patrolDelayMs !== undefined && patrolDelayMs >= 0 ? patrolDelayMs : undefined,
      incomplete: record.incomplete || !revisionTimestamp,
      diffUrl: buildDiffUrl(endpoint, revisionTitle, record.revisionId, revision?.parentid ?? record.oldRevisionId),
    };
  });
}
