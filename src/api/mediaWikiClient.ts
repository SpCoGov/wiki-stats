import type { MediaWikiResponse, QueryProgress, WikiContinuation } from "../types/mediawiki";
import { MediaWikiClientError, isPrivateLogLikeError } from "./errors";

const requestTimeoutMs = 20_000;

export interface QueryManyOptions {
  continuationKeys: string[];
  maxPages?: number;
  onProgress?: (progress: QueryProgress) => void;
}

function withRequiredParams(params: Record<string, string | number | boolean | undefined>) {
  return {
    format: "json",
    origin: "*",
    action: "query",
    ...params,
  };
}

function composeAbortSignals(signals: AbortSignal[]) {
  const controller = new AbortController();
  const abort = () => controller.abort();

  signals.forEach((signal) => {
    if (signal.aborted) {
      abort();
    } else {
      signal.addEventListener("abort", abort, { once: true });
    }
  });

  return controller.signal;
}

function summarizeLargeLists(value: unknown): unknown {
  if (Array.isArray(value)) {
    return { omittedList: true, count: value.length };
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const object = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(object).map(([key, item]) => {
      if (["usercontribs", "logevents", "users", "pages", "revisions"].includes(key)) {
        if (Array.isArray(item)) {
          return [key, { omittedList: true, count: item.length }];
        }
        if (item && typeof item === "object") {
          return [key, { omittedObject: true, count: Object.keys(item).length }];
        }
      }
      return [key, summarizeLargeLists(item)];
    }),
  );
}

function logMediaWikiResult(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  json: MediaWikiResponse<unknown>,
) {
  console.log("[MediaWiki API]", {
    endpoint,
    params: Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
    ),
    result: summarizeLargeLists(json),
  });
}

export async function queryMediaWiki<TQuery>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  signal?: AbortSignal,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  const combinedSignal = signal ? composeAbortSignals([signal, controller.signal]) : controller.signal;
  const url = new URL(endpoint);
  const requestParams = withRequiredParams(params);

  Object.entries(requestParams).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), { signal: combinedSignal });
    if (!response.ok) {
      throw new MediaWikiClientError(response.statusText, String(response.status));
    }

    const json = (await response.json()) as MediaWikiResponse<TQuery>;
    logMediaWikiResult(endpoint, requestParams, json as MediaWikiResponse<unknown>);
    if (json.error) {
      throw new MediaWikiClientError(
        json.error.info,
        json.error.code,
        isPrivateLogLikeError(json.error.code, json.error.info),
      );
    }

    return json;
  } catch (error) {
    if (error instanceof MediaWikiClientError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new MediaWikiClientError("Request timed out or was cancelled.", "timeout");
    }
    throw new MediaWikiClientError(
      "Unable to reach the Wiki API. Check the endpoint and CORS settings.",
      "network",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function queryMediaWikiMany<TQuery>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>,
  options: QueryManyOptions,
  signal?: AbortSignal,
) {
  const maxPages = options.maxPages ?? 5;
  const pages: Array<MediaWikiResponse<TQuery>> = [];
  let continuation: WikiContinuation | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await queryMediaWiki<TQuery>(
      endpoint,
      { ...params, ...continuation },
      signal,
    );
    pages.push(response);

    continuation = response.continue;
    options.onProgress?.({
      completedPages: page + 1,
      maxPages,
      hasMore: Boolean(
        continuation && options.continuationKeys.some((key) => key in continuation!),
      ),
      phase: "list",
      batchSize: 500,
    });
    if (!continuation || !options.continuationKeys.some((key) => key in continuation!)) {
      break;
    }
  }

  return pages;
}
