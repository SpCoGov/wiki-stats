import { queryMediaWiki, queryMediaWikiMany } from "./mediaWikiClient";
import type { QueryProgress } from "../types/mediawiki";

interface WikiUser {
  userid?: number;
  name: string;
  missing?: boolean | "";
  groups?: string[];
  rights?: string[];
}

interface UsersQuery {
  users?: WikiUser[];
}

interface AllUsersQuery {
  allusers?: WikiUser[];
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function fetchUsersMeta(
  endpoint: string,
  users: string[],
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const uniqueUsers = [...new Set(users.filter(Boolean))];
  const result = new Map<string, WikiUser>();
  const batches = chunk(uniqueUsers, 50);

  for (const [index, batch] of batches.entries()) {
    const response = await queryMediaWiki<UsersQuery>(
      endpoint,
      {
        list: "users",
        ususers: batch.join("|"),
        usprop: "groups|rights",
      },
      signal,
    );

    response.query?.users?.forEach((user) => result.set(user.name, user));
    onProgress?.({
      completedPages: index + 1,
      maxPages: batches.length,
      hasMore: index + 1 < batches.length,
      phase: "userMeta",
      batchSize: 50,
    });
  }

  return result;
}

export async function fetchUsersByGroupOrRight(
  endpoint: string,
  filters: { userGroup?: string; userRight?: string; limitPages?: number },
  signal?: AbortSignal,
  onProgress?: (progress: QueryProgress) => void,
) {
  const group = filters.userGroup?.trim();
  const right = filters.userRight?.trim();

  if (!group && !right) {
    return [];
  }

  const pages = await queryMediaWikiMany<AllUsersQuery>(
    endpoint,
    {
      list: "allusers",
      augroup: group,
      aurights: right,
      aulimit: 500,
      auprop: "groups",
    },
    {
      continuationKeys: ["aufrom"],
      maxPages: filters.limitPages ?? 3,
      onProgress: (progress) => onProgress?.({ ...progress, phase: "userMeta" }),
    },
    signal,
  );

  return pages
    .flatMap((page) => page.query?.allusers ?? [])
    .filter((user) => !group || user.groups?.includes(group))
    .map((user) => user.name);
}
