type TQueryResult = { data: unknown; error: unknown };

const QUERY_METHODS = [
  'select',
  'eq',
  'gte',
  'lte',
  'lt',
  'gt',
  'order',
  'limit',
  'update',
  'maybeSingle',
  'single',
];

/**
 * A Supabase client stand-in for table queries: every call is recorded as
 * `[method, ...args]` in `calls`, every builder method chains, and awaiting the
 * query resolves to `result`.
 */
export function createQueryMock(result: TQueryResult, calls: unknown[][] = []) {
  const builder: Record<string, unknown> = {};
  for (const method of QUERY_METHODS) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, ...args]);
      return builder;
    };
  }
  builder['then'] = (resolve: (r: TQueryResult) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);

  return {
    from: (table: string) => {
      calls.push(['from', table]);
      return builder;
    },
  };
}
