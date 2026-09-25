(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessProgressDashboard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='chessCoachChessComConnection_v1';
  const USERNAME_RE=/^[A-Za-z0-9_-]{3,25}$/;

  function normalizeUsername(value){
    const username=typeof value==='string'?value.trim():'';
    return USERNAME_RE.test(username)?username:null;
  }

  function createConnectionStore(storage){
    function get(){try{return normalizeUsername(storage.getItem(STORAGE_KEY));}catch(e){return null;}}
    function save(value){
      const username=normalizeUsername(value);if(!username)return null;
      try{storage.setItem(STORAGE_KEY,username);return username;}catch(e){return null;}
    }
    function remove(){try{storage.removeItem(STORAGE_KEY);return true;}catch(e){return false;}}
    return {get,save,remove,key:STORAGE_KEY};
  }

  function ratingSummary(stats){
    const modes=[['Rapid','chess_rapid'],['Blitz','chess_blitz'],['Bullet','chess_bullet']];
    return modes.map(([label,key])=>{
      const section=stats&&typeof stats==='object'?stats[key]:null;
      return {label,rating:Number.isFinite(section?.last?.rating)?section.last.rating:null,best:Number.isFinite(section?.best?.rating)?section.best.rating:null};
    });
  }

  function gameOutcome(game,username){
    const target=String(username||'').toLowerCase();
    const white=String(game?.white?.username||'').toLowerCase(),black=String(game?.black?.username||'').toLowerCase();
    const side=white===target?'white':black===target?'black':null;if(!side)return null;
    const mine=game[side]?.result,opponent=game[side==='white'?'black':'white']?.result;
    const result=mine==='win'?'win':opponent==='win'?'loss':'draw';
    return {result,side,rating:Number.isFinite(game[side]?.rating)?game[side].rating:null,timeClass:game.time_class||'unknown',endTime:Number(game.end_time)||0,url:typeof game.url==='string'?game.url:''};
  }

  function summarizeGames(games,username,limit=20){
    const rows=(Array.isArray(games)?games:[]).map(game=>gameOutcome(game,username)).filter(Boolean).sort((a,b)=>b.endTime-a.endTime).slice(0,limit);
    const summary={games:rows.length,wins:0,losses:0,draws:0,white:0,black:0,winRate:0,rows};
    rows.forEach(row=>{summary[row.result==='loss'?'losses':row.result+'s']++;summary[row.side]++;});
    summary.winRate=summary.games?Math.round(summary.wins/summary.games*100):0;
    return summary;
  }

  function localOpeningTotals(openings,store){
    const totals=openings.reduce((totals,opening)=>{
      const row=store.get(opening.id);totals.attempts+=row.attempts;totals.correct+=row.correct;totals.completions+=row.completions;return totals;
    },{attempts:0,correct:0,completions:0,accuracy:0});
    totals.accuracy=totals.attempts?Math.round(totals.correct/totals.attempts*100):0;return totals;
  }

  return {STORAGE_KEY,normalizeUsername,createConnectionStore,ratingSummary,gameOutcome,summarizeGames,localOpeningTotals};
});

