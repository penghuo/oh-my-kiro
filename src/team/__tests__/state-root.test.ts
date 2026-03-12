import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCanonicalTeamStateRoot } from '../state-root.js';

describe('state-root', () => {
  it('resolveCanonicalTeamStateRoot resolves to leader .omk/state', () => {
    assert.equal(
      resolveCanonicalTeamStateRoot('/tmp/demo/project'),
      '/tmp/demo/project/.omk/state',
    );
  });
});

