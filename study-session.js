(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessCoachSession=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STORAGE_KEY='chessCoachSession_v1';
  const MAX_BYTES=750000;

  function plainObject(value){
    return Boolean(value&&typeof value==='object'&&!Array.isArray(value));
  }

  function validString(value,max){
    return typeof value==='string'&&value.length<=max;
  }

  function validate(session){
    if(!plainObject(session)||session.version!==1)return false;
    if(!validString(session.pgn,250000)||!Array.isArray(session.loadedMoves)||session.loadedMoves.length>2000)return false;
    if(!session.loadedMoves.every(move=>validString(move,40)))return false;
    if(!Number.isInteger(session.cursor)||session.cursor<0||session.cursor>session.loadedMoves.length)return false;
    if(!['white','black'].includes(session.orientation)||typeof session.engineEnabled!=='boolean')return false;
    if(session.batchRows!==undefined&&(!Array.isArray(session.batchRows)||session.batchRows.length>2000))return false;
    if(session.tryLine!==null&&session.tryLine!==undefined){
      const line=session.tryLine;
      if(!plainObject(line)||!validString(line.startFen,120)||!Array.isArray(line.moves)||line.moves.length>500)return false;
      if(!line.moves.every(move=>validString(move,40))||!plainObject(line.snapshot))return false;
      if(!validString(line.snapshot.fen,120)||!Number.isInteger(line.snapshot.cursor))return false;
    }
    try{return new TextEncoder().encode(JSON.stringify(session)).length<=MAX_BYTES;}catch(e){return false;}
  }

  function createStore(storage){
    return {
      save(session){
        if(!validate(session))return false;
        try{storage.setItem(STORAGE_KEY,JSON.stringify(session));return true;}catch(e){return false;}
      },
      load(){
        try{
          const raw=storage.getItem(STORAGE_KEY);
          if(!raw)return null;
          const session=JSON.parse(raw);
          if(validate(session))return session;
          storage.removeItem(STORAGE_KEY);
        }catch(e){try{storage.removeItem(STORAGE_KEY);}catch(ignore){}}
        return null;
      },
      clear(){try{storage.removeItem(STORAGE_KEY);}catch(e){}},
      key:STORAGE_KEY
    };
  }

  return {STORAGE_KEY,MAX_BYTES,validate,createStore};
});

