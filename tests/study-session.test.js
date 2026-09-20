const test=require('node:test');
const assert=require('node:assert/strict');
const Session=require('../study-session.js');

function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};
}

function validSession(){
  return {version:1,pgn:'[White "A"]\n\n1. e4 e5',loadedMoves:['e4','e5'],cursor:1,orientation:'black',engineEnabled:false,batchRows:[],tryLine:null};
}

test('round-trips a valid study session independently of other local storage',()=>{
  const storage=memoryStorage({chessCoachLearningProfile:'keep me'}),store=Session.createStore(storage);
  assert.equal(store.save(validSession()),true);
  assert.deepEqual(store.load(),validSession());
  store.clear();
  assert.equal(storage.getItem('chessCoachLearningProfile'),'keep me');
});

test('accepts a restorable Try a Line snapshot',()=>{
  const session=validSession();
  session.tryLine={startFen:'start fen',moves:['Nf3','Nc6'],snapshot:{fen:'original fen',cursor:1}};
  assert.equal(Session.validate(session),true);
});

test('accepts a custom move-list starting position',()=>{
  const session=validSession();
  session.moveStartFen='8/8/8/8/8/8/R3K3/4k3 w - - 0 1';
  assert.equal(Session.validate(session),true);
  assert.equal(Session.validate({...session,moveStartFen:'x'.repeat(121)}),false);
});

test('rejects malformed and oversized session data',()=>{
  assert.equal(Session.validate({...validSession(),cursor:99}),false);
  assert.equal(Session.validate({...validSession(),pgn:'x'.repeat(Session.MAX_BYTES+1)}),false);
});

test('removes invalid stored JSON and starts cleanly',()=>{
  const storage=memoryStorage({[Session.STORAGE_KEY]:'{broken'}),store=Session.createStore(storage);
  assert.equal(store.load(),null);
  assert.equal(storage.getItem(Session.STORAGE_KEY),null);
});

