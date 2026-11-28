import assert from 'node:assert/strict';
import { clearApiCache, fetchPricingPlans, fetchResources, resolveApiBase } from './src/api/client.js';

assert.equal(resolveApiBase(), '/api');
assert.equal(resolveApiBase('  http://localhost:5000/api/  '), 'http://localhost:5000/api');

const calls = [];
globalThis.fetch = async (url, options) => {
  assert.equal(options.cache, undefined, 'local cache flag must not be sent to fetch');
  calls.push(url);
  return {
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => [{ id: calls.length }],
  };
};

clearApiCache();
const firstPricing = await fetchPricingPlans();
assert.deepEqual(await fetchPricingPlans(), firstPricing);
assert.deepEqual(await fetchResources(), [{ id: 2 }]);
assert.deepEqual(calls, ['/api/pricing', '/api/resources']);
console.log('Frontend API cache regression passed');
