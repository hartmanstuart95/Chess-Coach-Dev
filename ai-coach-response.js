(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AiCoachResponse=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FALLBACK_MESSAGE='AI Coach is temporarily unavailable. Please try again.';

  function safeWorkerError(data,httpStatus){
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    // Actual Worker errors use a string `error`, and may have no upstream status.
    // Use fixed messages rather than echoing arbitrary response content.
    if(typeof data.error==='string'){
      const known={
        'Unauthorized.':['ACCESS_TOKEN_REJECTED','The Worker rejected the access token. Re-enter your Chess Coach access token.'],
        'Service is not configured.':['SERVICE_NOT_CONFIGURED','The AI Worker is missing its Z.AI configuration.'],
        'Coaching service is temporarily unavailable.':['ZAI_UPSTREAM_ERROR','The Worker could not obtain a coaching response from Z.AI.'],
        'Coaching service returned an invalid response.':['INVALID_COACHING_RESPONSE','Z.AI returned a response the Worker could not parse or validate.'],
        'Request body is too large.':['REQUEST_TOO_LARGE','The coaching request exceeds the Worker size limit.'],
        'Request body must contain valid JSON.':['INVALID_REQUEST','The Worker could not read the coaching request.']
      };
      const entry=known[data.error];
      if(!entry)return null;
      const error={code:entry[0],upstreamStatus:Number.isInteger(data.upstreamStatus)&&data.upstreamStatus>=100&&data.upstreamStatus<=599?data.upstreamStatus:null,message:entry[1]};
      if(Number.isInteger(httpStatus))error.httpStatus=httpStatus;
      return error;
    }
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
      const error=safeWorkerError(data,response.status);
      return error?{kind:'worker-error',error}:{kind:'fallback',message:FALLBACK_MESSAGE};
    }
    return {kind:'worker-error',error:{code:'INVALID_COACHING_RESPONSE',httpStatus:response.status||200,upstreamStatus:null,message:'The coaching response does not match the expected format.'}};
  }

  return Object.freeze({FALLBACK_MESSAGE,safeWorkerError,readResponse});
});
