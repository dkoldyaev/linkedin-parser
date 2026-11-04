import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cvStorageKey } from './cvIndexedDB.js';

test('local CV drafts have separate keys for separate accounts', () => {
  assert.notEqual(cvStorageKey(1), cvStorageKey(2));
  assert.equal(cvStorageKey(1), cvStorageKey('1'));
  for (const value of [undefined, null, '', 0, -1, 'abc']) assert.throws(() => cvStorageKey(value));
});
