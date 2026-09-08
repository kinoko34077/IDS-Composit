export type IdsMatchResult =
  | { found: true; text: string; raw?: unknown }
  | { found: false }
  | { found: false; unavailable: true; error?: unknown };

export interface CharacterKnowledgeProvider {
  matchIds(ids: string): Promise<IdsMatchResult>;
}

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface MatchCache {
  get(key: string): IdsMatchResult | undefined;
  set(key: string, result: IdsMatchResult): void;
  clear?: () => void;
}

export type ChiseProviderOptions = {
  endpoint?: string;
  fetch?: FetchLike;
  timeoutMs?: number;
  cache?: MatchCache;
};
