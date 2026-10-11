'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {FALLBACK_MESSAGE,readResponse}=require('../ai-coach-response.js');

const coaching={
  summary:'Summary',whatYouTried:'Try',whatChanged:'Change',opponentIdea:'Idea',
  whyEnginePrefers:'Reason',lessonToRemember:'Lesson'
};
const validSuccess=data=>data===coaching;

test('preserves a successful coaching response',async()=>{
  const result=await readResponse({ok:true,json:async()=>coaching},validSuccess);
  assert.deepEqual(result,{kind:'success',data:coaching});
});

test('returns only safe fields from a controlled Worker JSON error',async()=>{
  const responseBody={
    error:{code:'UPSTREAM_UNAVAILABLE',upstreamStatus:502,message:'The model provider is temporarily unavailable.',debug:'secret'},
    prompt:'private position'
  };
  const result=await readResponse({ok:false,json:async()=>responseBody},validSuccess);
  assert.deepEqual(result,{kind:'worker-error',error:{
    code:'UPSTREAM_UNAVAILABLE',upstreamStatus:502,message:'The model provider is temporarily unavailable.'
  }});
  assert.equal(JSON.stringify(result).includes('secret'),false);
  assert.equal(JSON.stringify(result).includes('private position'),false);
});

test('uses the temporary-unavailable message for a non-JSON server error',async()=>{
  const result=await readResponse({ok:false,json:async()=>{throw new SyntaxError('not JSON');}},validSuccess);
  assert.deepEqual(result,{kind:'fallback',message:FALLBACK_MESSAGE});
  assert.equal(result.message,'AI Coach is temporarily unavailable. Please try again.');
});

test('actual Worker upstream error shows code and provider status',async()=>{
  const result=await readResponse({ok:false,status:502,json:async()=>({error:'Coaching service is temporarily unavailable.',code:'ZAI_UPSTREAM_ERROR',upstreamStatus:429})},validSuccess);
  assert.equal(result.kind,'worker-error');
  assert.equal(result.error.code,'ZAI_UPSTREAM_ERROR');
  assert.equal(result.error.httpStatus,502);
  assert.equal(result.error.upstreamStatus,429);
});

test('actual Worker authentication and invalid-model errors need no upstream status',async()=>{
  for(const [status,message,code] of [[401,'Unauthorized.','ACCESS_TOKEN_REJECTED'],[502,'Coaching service returned an invalid response.','INVALID_COACHING_RESPONSE'],[503,'Service is not configured.','SERVICE_NOT_CONFIGURED']]){
    const result=await readResponse({ok:false,status,json:async()=>({error:message})},validSuccess);
    assert.equal(result.error.code,code);
    assert.equal(result.error.httpStatus,status);
    assert.equal(result.error.upstreamStatus,null);
  }
});

test('unexpected error strings and extra fields are not echoed',async()=>{
  const result=await readResponse({ok:false,status:502,json:async()=>({error:'Bearer private-secret',code:'private-secret',debug:'private'})},validSuccess);
  assert.equal(result.kind,'fallback');
  assert.doesNotMatch(JSON.stringify(result),/private-secret/);
});

test('HTTP success with invalid coaching data reports a format error',async()=>{
  const result=await readResponse({ok:true,status:200,json:async()=>({unexpected:'private'})},validSuccess);
  assert.equal(result.error.code,'INVALID_COACHING_RESPONSE');
  assert.equal(result.error.httpStatus,200);
  assert.doesNotMatch(JSON.stringify(result),/private/);
});
