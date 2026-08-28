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
