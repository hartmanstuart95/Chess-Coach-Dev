const test=require('node:test');
const assert=require('node:assert/strict');
const Position=require('../position-tools.js');

test('round-trips the standard chess position',()=>{
  const fen='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  assert.equal(Position.buildFen(Position.parseFen(fen)),fen);
});

test('builds a legal custom position with move settings',()=>{
  const position={pieces:{e1:{color:'w',type:'k'},e8:{color:'b',type:'k'},d4:{color:'w',type:'q'}},turn:'b',castling:'-',enPassant:'-',halfmove:0,fullmove:12};
  assert.deepEqual(Position.validate(position),{valid:true,fen:'4k3/8/8/8/3Q4/8/8/4K3 b - - 0 12'});
});

test('rejects missing kings and pawns on promotion ranks',()=>{
  assert.equal(Position.validate({pieces:{e1:{color:'w',type:'k'}},turn:'w'}).valid,false);
  assert.match(Position.validate({pieces:{e1:{color:'w',type:'k'},e8:{color:'b',type:'k'},a8:{color:'w',type:'p'}},turn:'w'}).message,/Pawns/);
});

test('rejects malformed FEN input',()=>{
  assert.throws(()=>Position.parseFen('8/8/8 w - - 0 1'),/eight ranks/);
  assert.throws(()=>Position.parseFen('8/8/8/8/8/8/8/9 w - - 0 1'),/invalid piece layout|eight squares/);
});

