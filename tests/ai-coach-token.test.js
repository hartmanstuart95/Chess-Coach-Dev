'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createTokenStore}=require('../ai-coach-token.js');

function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
    has:key=>values.has(key)
  };
}

test('save activates connected state and explain uses the saved bearer token',async()=>{
  const storage=memoryStorage();
  const tokenStore=createTokenStore(storage);
  let request;
  const fetchStub=async(url,options)=>{request={url,options};return {status:200};};

  assert.equal(tokenStore.save('  regression-access-code  '),true);
  assert.equal(Boolean(tokenStore.get()),true,'the shared getter drives connected status');

  await fetchStub('/coach/explain-line',{
    method:'POST',
    headers:{Authorization:'Bearer '+tokenStore.get(),'Content-Type':'application/json'}
  });

  assert.equal(request.options.headers.Authorization,'Bearer regression-access-code');
  assert.equal(request.options.method,'POST');
});

test('application wiring uses the shared getter for status and the explain request',()=>{
  const source=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.match(source,/function getAiCoachToken\(\)\{\s*return aiCoachTokenStore\.get\(\);\s*\}/);
  assert.match(source,/const connected=Boolean\(getAiCoachToken\(\)\)/);
  assert.match(source,/async function explainTryLine\(\)\{\s*const token=getAiCoachToken\(\)/);
  assert.match(source,/'Authorization':'Bearer '\+token/);
});

test('migrates the v0.9.3.3 key and remove clears stored and active state',()=>{
  const storage=memoryStorage({chessCoachAccessToken:'legacy-access-code'});
  const tokenStore=createTokenStore(storage);

  assert.equal(Boolean(tokenStore.get()),true);
  assert.equal(storage.has('chessCoachAccessToken'),false);
  tokenStore.remove();
  assert.equal(tokenStore.get(),'');
  assert.equal(storage.has('chessCoach.aiCoachToken'),false);
});

test('rejects empty, whitespace-containing, control-character, and oversized values',()=>{
  const tokenStore=createTokenStore(memoryStorage());
  ['', '   ', 'two words', 'bad\nvalue', 'x'.repeat(4097)].forEach(value=>assert.equal(tokenStore.save(value),false));
  assert.equal(tokenStore.get(),'');
});
