import { queryMediaWiki } from "./mediaWikiClient";

interface NamespaceInfo {
  id: number;
  canonical?: string;
  "*": string;
}

interface SiteInfoQuery {
  namespaces?: Record<string, NamespaceInfo>;
}

export async function fetchNamespaces(endpoint: string, signal?: AbortSignal) {
  const response = await queryMediaWiki<SiteInfoQuery>(
    endpoint,
    {
      meta: "siteinfo",
      siprop: "namespaces",
    },
    signal,
  );

  const map = new Map<number, string>();
  Object.values(response.query?.namespaces ?? {}).forEach((namespace) => {
    const name = namespace["*"] || namespace.canonical || (namespace.id === 0 ? "Main" : String(namespace.id));
    map.set(namespace.id, name);
  });
  return map;
}
