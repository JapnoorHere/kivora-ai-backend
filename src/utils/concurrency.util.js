/**
 * Runs `worker` over `items` with at most `limit` in flight at once — a
 * handful of async runners pulling off a shared cursor. Small enough not to
 * need a dependency for it.
 */
export const mapWithConcurrency = async (items, limit, worker) => {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
};
