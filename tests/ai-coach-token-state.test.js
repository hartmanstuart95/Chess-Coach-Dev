const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

const context = { AI_COACH_TOKEN_KEY: 'chessCoachAccessToken' };
vm.runInNewContext(`${extractFunction('createAiCoachTokenState')}; this.factory=createAiCoachTokenState;`, context);

function memoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

// Regression: Save and Explain must observe the same token state.
const storage = memoryStorage();
const tokenState = context.factory(storage);
const enteredToken = '  regression-secret  ';
const savedResult = tokenState.saveToken(enteredToken);
assert.equal(savedResult.saved, true);
assert.equal(savedResult.persisted, true);
assert.equal(tokenState.getToken(), 'regression-secret');
const status = tokenState.getToken() ? 'Connected on this browser' : 'Access code required';
assert.equal(status, 'Connected on this browser');

let request;
const fakeFetch = (_url, options) => { request = options; };
fakeFetch('worker', { headers: { Authorization: `Bearer ${tokenState.getToken()}` } });
assert.equal(request.headers.Authorization, 'Bearer regression-secret');

// The production click handler must use the shared getter at click time.
const explainSource = html.slice(html.indexOf('async function explainTryLine'), html.indexOf('function requestTryLineAnalysis'));
assert.match(explainSource, /const token=getAiCoachToken\(\)/);
assert.match(explainSource, /'Authorization':'Bearer '\+token/);

// Storage denial retains a session-only token, and Remove clears both sources.
const deniedStorage = {
  getItem() { throw new Error('denied'); },
  setItem() { throw new Error('denied'); },
  removeItem() { throw new Error('denied'); }
};
const sessionState = context.factory(deniedStorage);
const sessionResult = sessionState.saveToken(' session-secret ');
assert.equal(sessionResult.saved, true);
assert.equal(sessionResult.persisted, false);
assert.equal(sessionState.getToken(), 'session-secret');
sessionState.removeToken();
assert.equal(sessionState.getToken(), '');

tokenState.removeToken();
assert.equal(tokenState.getToken(), '');
assert.equal(storage.getItem(context.AI_COACH_TOKEN_KEY), null);

console.log('AI Coach token save/status/explain/remove regression passed.');
