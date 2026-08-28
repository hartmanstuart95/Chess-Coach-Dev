(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AiCoachToken=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='chessCoach.aiCoachToken';
  const OBSOLETE_STORAGE_KEYS=['chessCoachAccessToken','chessCoachAiCoachToken'];

  function normalizeToken(value){
    if(typeof value!=='string')return '';
    const token=value.trim();
    return token&&token.length<=4096&&!/[\s\u0000-\u001f\u007f]/.test(token)?token:'';
  }

  function createTokenStore(storage){
    let activeToken='';

    function removeObsoleteKeys(){
      OBSOLETE_STORAGE_KEYS.forEach(key=>storage.removeItem(key));
    }

    try{
      activeToken=normalizeToken(storage.getItem(STORAGE_KEY));
      if(!activeToken){
        for(const key of OBSOLETE_STORAGE_KEYS){
          const legacyToken=normalizeToken(storage.getItem(key));
          if(legacyToken){
            storage.setItem(STORAGE_KEY,legacyToken);
            activeToken=legacyToken;
            break;
          }
        }
      }
      removeObsoleteKeys();
    }catch(e){
      activeToken='';
    }

    return Object.freeze({
      get(){return activeToken;},
      save(value){
        const token=normalizeToken(value);
        if(!token)return false;
        try{
          storage.setItem(STORAGE_KEY,token);
          removeObsoleteKeys();
          activeToken=token;
          return true;
        }catch(e){
          return false;
        }
      },
      remove(){
        activeToken='';
        try{
          storage.removeItem(STORAGE_KEY);
          removeObsoleteKeys();
        }catch(e){}
      }
    });
  }

  return Object.freeze({createTokenStore});
});
