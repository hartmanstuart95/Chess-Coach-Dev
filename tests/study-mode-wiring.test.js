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
  assert.match(html,/game=new Chess\(ChessPositionTools\.normalizeFen\(saved\.fen\)\);moveStartFen=ChessPositionTools\.normalizeFen\(saved\.moveStartFen\|\|STANDARD_FEN\);cursor=saved\.cursor;loadedMoves=saved\.loadedMoves\.slice\(\)/);
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
  assert.match(html,/game=new Chess\(ChessPositionTools\.normalizeFen\(saved\.fen\)\);moveStartFen=ChessPositionTools\.normalizeFen\(saved\.moveStartFen\|\|STANDARD_FEN\)/);
});

test('custom positions are normalized and engine failures release full-game review',()=>{
  assert.match(html,/moveStartFen=ChessPositionTools\.normalizeFen\(saved\.moveStartFen/);
  assert.match(html,/if\(job\.retries>=1\)/);
  assert.match(html,/This position could not be analyzed\. Check the setup and try again\./);
  assert.match(html,/stopEngine\('Stockfish worker stopped\. Restart the engine and try again\.'\)/);
});

test('Position Library opens saved positions in analysis, Try a Line, and bot practice',()=>{
  assert.match(html,/ChessPositionLibrary\.createStore\(localStorage\)/);
  assert.match(html,/function openLibraryAnalysis\(entry\)/);
  assert.match(html,/switchTab\('engineTab'\)/);
  assert.match(html,/function openLibraryTryLine\(entry\)[\s\S]*?startTryLine\(\)/);
  assert.match(html,/function openLibraryBot\(entry\)[\s\S]*?startBotGame\(fen,playerColor/);
  assert.match(html,/positionLibraryStore\.save\(\{name,category:/);
});

test('Threat Scanner reveals current-position danger after the learner thinks first',()=>{
  assert.match(html,/src="\.\/threat-scanner\.js"/);
  assert.match(html,/What do you think the threat is\?/);
  assert.match(html,/function revealThreatScanner\(\)/);
  assert.match(html,/ChessThreatScanner\.scan\(fen\)/);
  assert.match(html,/function threatForcingMoves\(fen\)/);
  assert.match(html,/threatResults\.dataset\.fen!==displayedFen/);
  assert.match(html,/threatRevealBtn.*revealThreatScanner/);
});

test('Opening Practice runs recall drills and preserves the prior study position',()=>{
  assert.match(html,/src="\.\/opening-practice\.js"/);
  assert.match(html,/ChessOpeningPractice\.createProgressStore\(localStorage\)/);
  assert.match(html,/function startOpeningPractice\(\)/);
  assert.match(html,/snapshot=appSnapshot\(\)/);
  assert.match(html,/function handleOpeningPracticeMove\(move\)/);
  assert.match(html,/ChessOpeningPractice\.isCorrect\(expected,move\.san\)/);
  assert.match(html,/game\.undo\(\)/);
  assert.match(html,/restoreAppSnapshot\(snapshot\)/);
  assert.match(html,/if\(!openingPractice\)scheduleSessionSave\(\)/);
});

