const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

function functionSource(name,next){
  return html.slice(html.indexOf('  function '+name+'('),html.indexOf('  function '+next+'('));
}

test('engine failure unlocks Try a Line, clears stale advice, and preserves position/history',()=>{
  const elements={};
  const line={locked:true,moves:['Be7'],startFen:'unchanged',baseEval:{type:'cp',value:10},currentEval:{type:'cp',value:20},stockfishRecommendedResponseSan:'Nf3',stockfishPrincipalVariationSan:'Nf3'};
  let rendered=0,saved=0;
  const context={
    tryLine:line,game:{fen:()=> 'current position'},engine:{postMessage(){},terminate(){}},
    engineGeneration:1,engineReady:true,engineLoading:false,activeAnalysisFen:'old',engineJob:{},
    analysisTimer:null,engineStartupTimer:null,batchMode:null,reviewStage:null,reviewData:null,
    bestMoveHighlight:{from:'g1',to:'f3'},feedbackEl:{},clearTimeout(){},clearEngineWatchdog(){},
    clearAiCoachExplanation(){},renderTryLine(){rendered++;},render(){},scheduleSessionSave(){saved++;},
    document:{getElementById(id){return elements[id]??=( {textContent:''} );}}
  };
  vm.createContext(context);
  vm.runInContext(functionSource('stopEngine','restartEngine'),context);
  context.stopEngine('Worker failed');
  assert.equal(line.locked,false);
  assert.equal(line.analysisFailed,true);
  assert.equal(line.currentEval,null);
  assert.equal(line.stockfishRecommendedResponseSan,null);
  assert.equal(line.stockfishPrincipalVariationSan,null);
  assert.deepEqual(line.moves,['Be7']);
  assert.equal(line.startFen,'unchanged');
  assert.equal(line.baseEval.value,10);
  assert.equal(context.game.fen(),'current position');
  assert.match(elements.tryLineStatus.textContent,/Retry Stockfish/);
  assert.equal(rendered,1);assert.equal(saved,1);
});

test('engine failure outside Try a Line still stops normally',()=>{
  const context={tryLine:null,engine:null,engineGeneration:0,engineReady:true,engineLoading:false,
    activeAnalysisFen:null,engineJob:null,analysisTimer:null,engineStartupTimer:null,
    batchMode:null,reviewStage:null,clearTimeout(){},clearEngineWatchdog(){},
    document:{getElementById(){return {};}}};
  vm.createContext(context);vm.runInContext(functionSource('stopEngine','restartEngine'),context);
  context.stopEngine('Stopped');assert.equal(context.engineReady,false);
});

test('startup chatter does not cancel readiness timeout; retry is wired to engine restart',()=>{
  assert.match(html,/if\(e\.data==='readyok'\)\{\s*started=true;\s*clearTimeout\(engineStartupTimer\)/);
  assert.match(html,/getElementById\('tryLineRetry'\)\.addEventListener\('click',restartEngine\)/);
  assert.match(html,/getElementById\('tryLineRetry'\)\.hidden=!tryLine\.analysisFailed/);
  assert.match(html,/function requestTryLineAnalysis\(kind\)\{\s*if\(!tryLine\)return;\s*tryLine\.analysisFailed=false/);
});
