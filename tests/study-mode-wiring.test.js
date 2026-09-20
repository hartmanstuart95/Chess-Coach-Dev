const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('Study Mode invalidates jobs and blocks engine work while disabled',()=>{
  assert.match(html,/engineAdviceGeneration\+\+/);
  assert.match(html,/job\.adviceGeneration!==engineAdviceGeneration/);
  assert.match(html,/if\(\(!engineHelpEnabled&&owner!=='bot'\)\|\|!engineReady\|\|!engine\)return false/);
  assert.match(html,/engine\.postMessage\('stop'\);engine\.postMessage\('isready'\)/);
});

test('turning Stockfish on in Try a Line analyzes the current line',()=>{
  assert.match(html,/if\(tryLine\)requestTryLineAnalysis\(tryLine\.baseEval\?'current':'base'\)/);
  assert.match(html,/requestEngineJob\('tryline',game\.fen\(\),12,0,tryLineGeneration,kind\)/);
});

test('session restore keeps canonical and variation histories separate',()=>{
  assert.match(html,/loadedMoves:tryLine\.snapshot\.loadedMoves\.slice\(\)/);
  assert.match(html,/const lineGame=new Chess\(saved\.tryLine\.startFen\)/);
  assert.match(html,/game=new Chess\(saved\.fen\);moveStartFen=saved\.moveStartFen\|\|STANDARD_FEN;cursor=saved\.cursor;loadedMoves=saved\.loadedMoves\.slice\(\)/);
});

test('locked SVG renderer remains in use',()=>{
  assert.match(html,/img\.src=pieceSVGData\(p\.type,p\.color\)/);
  assert.doesNotMatch(html,/labGlyphs/);
});

test('custom setup and bot practice share the current-position engine safely',()=>{
  assert.match(html,/function enterSetupPosition\(fen=game\.fen\(\)\)/);
  assert.match(html,/requestEngineJob\('bot',game\.fen\(\),botGame\.depth\)/);
  assert.match(html,/if\(job\.owner==='bot'\)/);
  assert.match(html,/if\(\(!engineHelpEnabled&&owner!=='bot'\)\|\|!engineReady\|\|!engine\)return false/);
});

test('custom-position moves rebuild from their original FEN before Try a Line',()=>{
  assert.match(html,/game=new Chess\(result\.fen\);moveStartFen=result\.fen;loadedMoves=\[\]/);
  assert.match(html,/function rebuildTo\(n\)[\s\S]*?const rebuilt=new Chess\(moveStartFen\)/);
  assert.match(html,/function buildPositionAt\(n\)[\s\S]*?const g=new Chess\(moveStartFen\)/);
  assert.match(html,/snapshot:\{fen:game\.fen\(\),moveStartFen,cursor/);
  assert.match(html,/game=new Chess\(saved\.fen\);moveStartFen=saved\.moveStartFen\|\|STANDARD_FEN/);
});

