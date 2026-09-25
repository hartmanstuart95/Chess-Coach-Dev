const test=require('node:test');
const assert=require('node:assert/strict');
const Practice=require('../opening-practice.js');

function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value))};}

test('provides unique curated openings with legal-looking move lines',()=>{
  assert.equal(Practice.OPENINGS.length,25);
  assert.equal(new Set(Practice.OPENINGS.map(opening=>opening.id)).size,25);
  assert.ok(Practice.OPENINGS.every(opening=>opening.name&&opening.eco&&opening.moves.length));
});

test('checks turns and normalizes SAN annotations',()=>{
  assert.equal(Practice.isUserTurn(0,'w'),true);
  assert.equal(Practice.isUserTurn(1,'w'),false);
  assert.equal(Practice.isUserTurn(3,'both'),true);
  assert.equal(Practice.isCorrect('Bb5','Bb5+?!'),true);
  assert.equal(Practice.isCorrect('Bb5','Bc4'),false);
});

test('opening recognition uses the shared practice repertoire',()=>{
  const match=Practice.findMatch(['e4','e5','Nf3','Nc6','Bb5','a6']);
  assert.equal(match.id,'ruy-lopez');
  assert.equal(match.matched,5);
});

test('progress store records accuracy and completed drills',()=>{
  const store=Practice.createProgressStore(memoryStorage(),{now:()=>123});
  store.recordAttempt('italian',true);store.recordAttempt('italian',false);store.recordCompletion('italian');
  assert.deepEqual(store.get('italian'),{attempts:2,correct:1,completions:1,lastPracticed:123});
  assert.equal(store.recordAttempt('unknown',true),null);
});

