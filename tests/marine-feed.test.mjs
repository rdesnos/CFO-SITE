import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMarineFeedQuery, parseFeedLimit } from '../supabase/functions/cfo-actu-feed/logic.mjs';

test('a Marine feed cannot spend its limit on another artist', () => {
  const calls = [];
  const query = {
    from: name => (calls.push(['from', name]), query),
    select: columns => (calls.push(['select', columns]), query),
    eq: (field, value) => (calls.push(['eq', field, value]), query),
    limit: n => (calls.push(['limit', n]), query),
  };
  buildMarineFeedQuery(query, new URL('https://example.test/?artist_slug=philypa&limit=2&tier=gold&category=musique'));
  assert.deepEqual(calls, [['from', 'cfo_actu_feed'], ['select', '*'], ['eq', 'artist_slug', 'marine'], ['eq', 'source_tier', 'gold'], ['eq', 'category', 'musique'], ['limit', 2]]);
});

test('invalid limits never become NaN or unbounded queries', () => {
  for (const [input, expected] of [[null,20],['',20],['abc',20],['Infinity',20],['-2',1],['1000',50],['2.9',2]]) assert.equal(parseFeedLimit(input), expected);
});
