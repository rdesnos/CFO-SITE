export function parseFeedLimit(raw) {
  if (raw === null || raw === '') return 20;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.min(50, Math.max(1, Math.floor(value))) : 20;
}

// This endpoint belongs to CFO Marine. Scope before applying the row limit.
export function buildMarineFeedQuery(client, url) {
  let query = client.from('cfo_actu_feed').select('*').eq('artist_slug', 'marine');
  const tier = url.searchParams.get('tier');
  const category = url.searchParams.get('category');
  if (['platinum', 'gold', 'silver'].includes(tier)) query = query.eq('source_tier', tier);
  if (category) query = query.eq('category', category);
  // cfo_actu_feed orders by coalesce(published_at, detected_at), preserving unknown dates.
  return query.limit(parseFeedLimit(url.searchParams.get('limit')));
}
