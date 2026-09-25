const test=require('node:test');
const assert=require('node:assert/strict');
const Library=require('../position-library.js');

function memoryStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key),values};
}

test('saves, lists, updates, and removes a position',()=>{
  let stamp=100;
  const store=Library.createStore(memoryStorage(),{now:()=>++stamp,makeId:()=> 'position-1'});
  const fen='4k3/8/8/8/3Q4/8/8/4K3 b - - 0 12';
  assert.equal(store.save({name:'Queen technique',category:'Endgame',fen}).id,'position-1');
  assert.equal(store.list()[0].name,'Queen technique');
  assert.equal(store.save({name:'Queen conversion',category:'Favorites',fen}).id,'position-1');
  assert.equal(store.list().length,1);
  assert.equal(store.list()[0].category,'Favorites');
  assert.equal(store.remove('position-1'),true);
  assert.deepEqual(store.list(),[]);
});

test('rejects malformed position input without changing storage',()=>{
  const storage=memoryStorage(),store=Library.createStore(storage,{makeId:()=> 'position-1'});
  assert.equal(store.save({name:'',category:'Tactics',fen:'valid-looking'}),null);
  assert.equal(store.save({name:'Test',category:'Unknown',fen:'valid-looking'}),null);
  assert.equal(store.save({name:'Test',category:'Tactics',fen:''}),null);
  assert.deepEqual(store.list(),[]);
});

test('cleans invalid stored entries and keeps valid ones',()=>{
  const valid={id:'one',name:'Fork',category:'Tactics',fen:'8/8/8/8/8/8/8/8 w - - 0 1',createdAt:1,updatedAt:1};
  const storage=memoryStorage({[Library.STORAGE_KEY]:JSON.stringify([valid,{id:'bad'}])});
  const store=Library.createStore(storage);
  assert.deepEqual(store.list(),[valid]);
  assert.deepEqual(JSON.parse(storage.getItem(Library.STORAGE_KEY)),[valid]);
});

