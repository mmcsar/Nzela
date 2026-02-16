export function withTiming<T extends Response>(response: T, startedAtMs: number): T {
  const elapsed = Date.now() - startedAtMs;
  response.headers.set('X-Response-Time', `${elapsed}ms`);
  return response;
}
