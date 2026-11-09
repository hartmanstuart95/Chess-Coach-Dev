(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessEngineComparison=api;
})(typeof globalThis==='undefined'?globalThis:this,function(){
  const engines=Object.freeze({
    stockfish:{name:'Stockfish',url:'./stockfish-worker.js',depth:12},
    lozza:{name:'Lozza',url:'./vendor/lozza/lozza.js',depth:10},
  });
  function parseLine(text){
    if(!text.startsWith('info ')||/\b(?:upperbound|lowerbound)\b/.test(text))return null;
    const depth=text.match(/\bdepth (\d+)/), rank=text.match(/\bmultipv (\d+)/);
    const score=text.match(/\bscore (cp|mate) (-?\d+)/), pv=text.match(/\bpv (.+)$/);
    if(!depth||!score||!pv)return null;
    const index=rank?Number(rank[1]):1, moves=pv[1].trim().split(/\s+/);
    if(index<1||index>3||!moves.every(move=>/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)))return null;
    return {rank:index,depth:Number(depth[1]),type:score[1],value:Number(score[2]),moves};
  }
  function search({engineId,fen,count,makeWorker=url=>new Worker(url),onUpdate,onFinish,onError,timeout=20000}){
    const config=Object.hasOwn(engines,engineId)?engines[engineId]:engines.stockfish;
    count=Math.min(3,Math.max(1,Number(count)||1));
    const worker=makeWorker(config.url), depths=new Map();
    let closed=false, phase='uci', latest=[], supportsMultiPV=false;
    const timer=setTimeout(()=>{stop();onError('Analysis timed out. Try again.');},timeout);
    function stop(){if(closed)return;closed=true;clearTimeout(timer);worker.terminate();}
    worker.onerror=()=>{if(closed)return;stop();onError('Engine could not run. Try again or choose another engine.');};
    worker.onmessage=event=>{
      if(closed||typeof event.data!=='string')return;
      for(const raw of event.data.split(/\r?\n/)){
        if(closed)break;
        const line=raw.trim();
        if(phase==='uci'&&/^option name MultiPV\b/i.test(line))supportsMultiPV=true;
        if(line==='uciok'&&phase==='uci'){
          phase='ready';
          if(supportsMultiPV)worker.postMessage('setoption name MultiPV value '+count);
          else count=1;
          worker.postMessage('isready');
        }else if(line==='readyok'&&phase==='ready'){
          phase='search';
          worker.postMessage('position fen '+fen);
          worker.postMessage('go depth '+config.depth);
        }else if(phase==='search'&&line.startsWith('bestmove ')){
          stop();onFinish(latest);
        }else if(phase==='search'){
          const entry=parseLine(line);
          if(!entry||entry.rank>count)continue;
          if(!depths.has(entry.depth))depths.set(entry.depth,new Map());
          const group=depths.get(entry.depth);
          group.set(entry.rank,entry);
          if(group.size===count&&(!latest.length||entry.depth>=latest[0].depth)){
            const sorted=[...group.values()].sort((a,b)=>a.rank-b.rank);
            if(new Set(sorted.map(item=>item.moves[0])).size===count){latest=sorted;onUpdate(latest);}
          }
        }
      }
    };
    try{worker.postMessage('uci');}catch(error){stop();throw error;}
    return stop;
  }
  return {engines,parseLine,search};
});
