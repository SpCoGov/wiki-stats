export interface WikiApiError {
  code: string;
  info: string;
}

export interface WikiContinuation {
  continue?: string;
  uccontinue?: string;
  lecontinue?: string;
  rccontinue?: string;
}

export interface QueryProgress {
  completedPages: number;
  maxPages: number;
  hasMore: boolean;
  phase: "list" | "revisionDetails" | "userMeta";
  batchSize: number;
}

export interface MediaWikiResponse<TQuery> {
  batchcomplete?: string;
  continue?: WikiContinuation;
  error?: WikiApiError;
  warnings?: Record<string, unknown>;
  query?: TQuery;
}

export interface UserContribution {
  userid?: number;
  user?: string;
  pageid?: number;
  revid: number;
  parentid?: number;
  ns: number;
  title: string;
  timestamp: string;
  comment?: string;
  size?: number;
  sizediff?: number;
  minor?: boolean | "";
  new?: boolean | "";
  tags?: string[];
}

export interface ContributionRecord {
  id: number;
  user: string;
  title: string;
  namespace: number;
  namespaceName?: string;
  timestamp: string;
  comment: string;
  revisionId: number;
  oldRevisionId?: number;
  size?: number;
  sizeDiff?: number;
  isMinor: boolean;
  isNew: boolean;
  tags: string[];
  diffUrl: string;
}

export interface ContributionFilters {
  user?: string;
  userGroup?: string;
  userRight?: string;
  start?: string;
  end?: string;
  namespace?: number | "all";
  minor?: "all" | "minor" | "nonminor";
  limitPages?: number;
}

export interface ContributionStats {
  totalEdits: number;
  todayEdits: number;
  daily: Array<{ label: string; value: number }>;
  hourly: Array<{ label: string; value: number }>;
  weekday: Array<{ label: string; value: number }>;
  namespaces: Array<{ label: string; value: number }>;
  topPages: Array<{ label: string; value: number }>;
  topUsers: Array<{ label: string; value: number }>;
  peakHour: string;
}

export interface PatrolLogEvent {
  logid: number;
  ns?: number;
  title?: string;
  pageid?: number;
  logpage?: number;
  type?: string;
  action?: string;
  user?: string;
  timestamp: string;
  comment?: string;
  params?: Record<string, unknown>;
}

export interface PatrolRecord {
  id: number;
  timestamp: string;
  patroller: string;
  revisionId?: number;
  oldRevisionId?: number;
  revisionTimestamp?: string;
  revisionUser?: string;
  title: string;
  namespace?: number;
  namespaceName?: string;
  action: string;
  comment: string;
  diffUrl?: string;
  patrolDelayMs?: number;
  rawParams: Record<string, unknown>;
  incomplete: boolean;
}

export interface PatrolFilters {
  user?: string;
  userGroup?: string;
  userRight?: string;
  includeSpeed?: boolean;
  start?: string;
  end?: string;
  title?: string;
  limitPages?: number;
}

export interface PatrolStats {
  totalPatrols: number;
  todayPatrols: number;
  completeSpeedCount: number;
  averageDelayMs?: number;
  medianDelayMs?: number;
  fastest?: PatrolRecord;
  slowest?: PatrolRecord;
  daily: Array<{ label: string; value: number }>;
  hourly: Array<{ label: string; value: number }>;
  weekday: Array<{ label: string; value: number }>;
  topPatrollers: Array<{ label: string; value: number }>;
  topPages: Array<{ label: string; value: number }>;
  delayDistribution: Array<{ label: string; value: number }>;
  averageDelayByPatroller: Array<{ label: string; value: number }>;
  averageDelayByNamespace: Array<{ label: string; value: number }>;
  averageDelayDaily: Array<{ label: string; value: number }>;
  peakHour: string;
}
