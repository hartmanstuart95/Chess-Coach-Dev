const test=require('node:test');
const assert=require('node:assert/strict');
const scanner=require('../threat-scanner.js');

test('finds a high-value hanging piece under attack',()=>{
  const result=scanner.scan('3rk3/8/8/8/3Q4/8/8/4K3 w - - 0 1');
  assert.equal(result.sideName,'White');
  assert.deepEqual(result.hanging.map(piece=>piece.square),['d4']);
  assert.equal(result.captureThreats[0].attackerName,'rook');
  assert.equal(result.captureThreats[0].victimName,'queen');
});

test('distinguishes a defended attacked piece from a hanging piece',()=>{
  const result=scanner.scan('3rk3/8/8/8/3Q4/8/8/3RK3 w - - 0 1');
  const queen=result.threatened.find(piece=>piece.square==='d4');
  assert.equal(queen.defenderCount,1);
  assert.equal(result.hanging.some(piece=>piece.square==='d4'),false);
  assert.equal(result.captureThreats.find(threat=>threat.target==='d4').defended,true);
});

test('reports check and controlled squares around the king',()=>{
  const result=scanner.scan('4r1k1/8/8/8/8/8/8/4K3 w - - 0 1');
  assert.equal(result.inCheck,true);
  assert.equal(result.kingDanger.square,'e1');
  assert.ok(result.kingDanger.controlledSquares.includes('e2'));
});

test('rejects malformed FEN input',()=>{
  assert.throws(()=>scanner.scan('not a fen'),/Invalid FEN/);
});

