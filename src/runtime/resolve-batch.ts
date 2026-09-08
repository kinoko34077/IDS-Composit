import type { Resolution } from '../core/types';

export const DEFAULT_MAX_CONCURRENCY = 4;

export type IdsResolver = (ids: string) => Promise<Resolution>;

function resolveConcurrency(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_MAX_CONCURRENCY;
  return Math.max(1, Math.floor(value));
}

export async function resolveUniqueIds(
  ids: string[],
  resolve: IdsResolver,
  maxConcurrency: number = DEFAULT_MAX_CONCURRENCY,
): Promise<Map<string, Resolution | undefined>> {
  const uniqueIds = Array.from(new Set(ids));
  const resolutions = new Map<string, Resolution | undefined>();
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < uniqueIds.length) {
      const index = nextIndex;
      nextIndex += 1;
      const source = uniqueIds[index];
      if (source === undefined) return;
      try {
        resolutions.set(source, await resolve(source));
      } catch {
        resolutions.set(source, undefined);
      }
    }
  };

  const workerCount = Math.min(resolveConcurrency(maxConcurrency), uniqueIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return resolutions;
}
