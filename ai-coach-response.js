(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AiCoachResponse=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FALLBACK_MESSAGE='AI Coach is temporarily unavailable. Please try again.';

  function safeWorkerError(data){
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const source=data.error&&typeof data.error==='object'&&!Array.isArray(data.error)?data.error:data;
    const code=source.code??source.errorCode??source.internalCode??(typeof data.error==='string'?data.error:null);
    const upstreamStatus=source.upstreamStatus??data.upstreamStatus;
    const message=source.message??source.sanitizedMessage??data.message??data.sanitizedMessage;
    if(typeof code!=='string'||!code.trim()||code.length>100)return null;
    if(!Number.isInteger(upstreamStatus)||upstreamStatus<100||upstreamStatus>599)return null;
    if(typeof message!=='string'||!message.trim()||message.length>500)return null;
    return {code:code.trim(),upstreamStatus,message:message.trim()};
  }

  async function readResponse(response,validSuccess){
    let data=null;
    try{data=await response.json();}catch(e){}
    if(response.ok&&validSuccess(data))return {kind:'success',data};
    if(!response.ok){
      const error=safeWorkerError(data);
      return error?{kind:'worker-error',error}:{kind:'fallback',message:FALLBACK_MESSAGE};
    }
    return {kind:'fallback',message:FALLBACK_MESSAGE};
  }

  return Object.freeze({FALLBACK_MESSAGE,safeWorkerError,readResponse});
});
