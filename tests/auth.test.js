import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import { parseJwt, getAccessToken, getUserRole } from '../js/modules/auth.js';

// Simple in-memory localStorage mock
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;

describe('auth utilities', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('parseJwt returns payload for valid token', () => {
    const payload = { role: 'admin' };
    const token = ['eyJoZWFkZXIiOiAiIn0=', btoa(JSON.stringify(payload)), 'sig'].join('.');
    const decoded = parseJwt(token);
    assert.deepEqual(decoded, payload);
  });

  it('parseJwt returns null for invalid token', () => {
    const decoded = parseJwt('invalid.token');
    assert.equal(decoded, null);
  });

  it('getAccessToken reads token from localStorage', () => {
    localStorage.setItem('userToken', 'abc123');
    assert.equal(getAccessToken(), 'abc123');
  });

  it('getUserRole returns role from valid token', () => {
    const payload = { role: 'user' };
    const token = ['e30', btoa(JSON.stringify(payload)), 'sig'].join('.');
    localStorage.setItem('userToken', token);
    assert.equal(getUserRole(), 'user');
  });

  it('getUserRole returns null with invalid token', () => {
    localStorage.setItem('userToken', 'invalid');
    assert.equal(getUserRole(), null);
  });

  it('getUserRole returns null with no token', () => {
    assert.equal(getUserRole(), null);
  });
});
