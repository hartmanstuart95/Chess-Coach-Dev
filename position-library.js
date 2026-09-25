(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessPositionLibrary=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='chessCoachPositionLibrary_v1';
  const CATEGORIES=['Tactics','Opening','Middlegame','Endgame','Defense','Favorites'];
  const MAX_POSITIONS=200;

  function validText(value,max){
    return typeof value==='string'&&value.trim().length>0&&value.trim().length<=max&&!/[\u0000-\u001f\u007f]/.test(value);
  }

  function validEntry(entry){
    return Boolean(entry&&typeof entry==='object'&&!Array.isArray(entry)&&
      validText(entry.id,100)&&validText(entry.name,80)&&CATEGORIES.includes(entry.category)&&
      validText(entry.fen,120)&&Number.isFinite(entry.createdAt)&&Number.isFinite(entry.updatedAt));
  }

  function createStore(storage,options={}){
    const now=typeof options.now==='function'?options.now:Date.now;
    const makeId=typeof options.makeId==='function'?options.makeId:()=>now().toString(36)+'-'+Math.random().toString(36).slice(2,9);

    function write(entries){
      try{storage.setItem(STORAGE_KEY,JSON.stringify(entries.slice(0,MAX_POSITIONS)));return true;}catch(e){return false;}
    }

    function list(){
      try{
        const raw=storage.getItem(STORAGE_KEY);
        if(!raw)return [];
        const parsed=JSON.parse(raw);
        if(!Array.isArray(parsed))throw new Error('Invalid library');
        const clean=parsed.filter(validEntry).slice(0,MAX_POSITIONS);
        if(clean.length!==parsed.length)write(clean);
        return clean;
      }catch(e){try{storage.removeItem(STORAGE_KEY);}catch(ignore){}return [];}
    }

    function save(position){
      const name=typeof position?.name==='string'?position.name.trim():'';
      const category=position?.category;
      const fen=typeof position?.fen==='string'?position.fen.trim():'';
      if(!validText(name,80)||!CATEGORIES.includes(category)||!validText(fen,120))return null;
      const entries=list();
      const existing=entries.find(item=>item.fen===fen);
      const stamp=now();
      let saved;
      if(existing){
        saved={...existing,name,category,updatedAt:stamp};
        entries.splice(entries.indexOf(existing),1);
      }else{
        saved={id:makeId(),name,category,fen,createdAt:stamp,updatedAt:stamp};
        if(!validEntry(saved))return null;
      }
      entries.unshift(saved);
      return write(entries)?saved:null;
    }

    function remove(id){
      const entries=list();
      const next=entries.filter(item=>item.id!==id);
      return next.length!==entries.length&&write(next);
    }

    function clear(){try{storage.removeItem(STORAGE_KEY);return true;}catch(e){return false;}}

    return {list,save,remove,clear,key:STORAGE_KEY};
  }

  return {STORAGE_KEY,CATEGORIES,MAX_POSITIONS,validEntry,createStore};
});

