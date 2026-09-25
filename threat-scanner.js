(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessThreatScanner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const FILES='abcdefgh';
  const PIECE_NAMES={p:'pawn',n:'knight',b:'bishop',r:'rook',q:'queen',k:'king'};
  const PIECE_VALUES={p:1,n:3,b:3,r:5,q:9,k:100};
  const KNIGHT_STEPS=[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
  const KING_STEPS=[[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]];
  const BISHOP_DIRS=[[1,1],[1,-1],[-1,1],[-1,-1]];
  const ROOK_DIRS=[[1,0],[-1,0],[0,1],[0,-1]];

  function other(color){return color==='w'?'b':'w';}
  function colorName(color){return color==='w'?'White':'Black';}
  function onBoard(file,rank){return file>=0&&file<8&&rank>=1&&rank<=8;}
  function square(file,rank){return FILES[file]+rank;}

  function parseFen(fen){
    if(typeof fen!=='string')throw new Error('Invalid FEN');
    const parts=fen.trim().split(/\s+/);
    if(parts.length<2||!['w','b'].includes(parts[1]))throw new Error('Invalid FEN');
    const rows=parts[0].split('/');
    if(rows.length!==8)throw new Error('Invalid FEN');
    const board={};
    rows.forEach((row,index)=>{
      let file=0;
      for(const symbol of row){
        if(/[1-8]/.test(symbol)){file+=Number(symbol);continue;}
        const type=symbol.toLowerCase();
        if(!PIECE_NAMES[type]||file>7)throw new Error('Invalid FEN');
        board[square(file,8-index)]={type,color:symbol===type?'b':'w'};
        file++;
      }
      if(file!==8)throw new Error('Invalid FEN');
    });
    return {board,turn:parts[1]};
  }

  function attacksFrom(from,piece,board){
    const file=FILES.indexOf(from[0]),rank=Number(from[1]);
    if(file<0||!onBoard(file,rank))return [];
    const targets=[];
    function addSteps(steps){
      steps.forEach(([df,dr])=>{const f=file+df,r=rank+dr;if(onBoard(f,r))targets.push(square(f,r));});
    }
    function addRays(directions){
      directions.forEach(([df,dr])=>{
        let f=file+df,r=rank+dr;
        while(onBoard(f,r)){
          const target=square(f,r);targets.push(target);
          if(board[target])break;
          f+=df;r+=dr;
        }
      });
    }
    if(piece.type==='p')addSteps([[1,piece.color==='w'?1:-1],[-1,piece.color==='w'?1:-1]]);
    else if(piece.type==='n')addSteps(KNIGHT_STEPS);
    else if(piece.type==='k')addSteps(KING_STEPS);
    else if(piece.type==='b')addRays(BISHOP_DIRS);
    else if(piece.type==='r')addRays(ROOK_DIRS);
    else if(piece.type==='q')addRays(BISHOP_DIRS.concat(ROOK_DIRS));
    return targets;
  }

  function attackersOf(target,color,board){
    return Object.entries(board)
      .filter(([,piece])=>piece.color===color)
      .filter(([from,piece])=>attacksFrom(from,piece,board).includes(target))
      .map(([from,piece])=>({square:from,type:piece.type,color:piece.color,name:PIECE_NAMES[piece.type]}));
  }

  function pieceRecord(atSquare,piece,attackers,defenders){
    return {
      square:atSquare,type:piece.type,color:piece.color,name:PIECE_NAMES[piece.type],value:PIECE_VALUES[piece.type],
      attackers,defenders,attackerCount:attackers.length,defenderCount:defenders.length
    };
  }

  function scan(fen){
    const parsed=parseFen(fen),board=parsed.board,side=parsed.turn,opponent=other(side);
    const pieces=[];
    Object.entries(board).forEach(([atSquare,piece])=>{
      if(piece.color!==side)return;
      pieces.push(pieceRecord(atSquare,piece,attackersOf(atSquare,opponent,board),attackersOf(atSquare,side,board)));
    });
    const threatened=pieces.filter(piece=>piece.attackerCount>0).sort((a,b)=>b.value-a.value||a.square.localeCompare(b.square));
    const hanging=threatened.filter(piece=>piece.type!=='k'&&piece.defenderCount===0);
    const underdefended=threatened.filter(piece=>piece.type!=='k'&&piece.attackerCount>piece.defenderCount&&piece.defenderCount>0);
    const loose=pieces.filter(piece=>piece.type!=='k'&&piece.defenderCount===0).sort((a,b)=>b.value-a.value||a.square.localeCompare(b.square));
    const king=pieces.find(piece=>piece.type==='k');
    const nearby=king?attacksFrom(king.square,king,{}):[];
    const controlled=king?nearby.filter(target=>attackersOf(target,opponent,board).length>0):[];
    const captureThreats=[];
    Object.entries(board).forEach(([from,piece])=>{
      if(piece.color!==opponent)return;
      attacksFrom(from,piece,board).forEach(target=>{
        const victim=board[target];
        if(victim&&victim.color===side)captureThreats.push({
          from,attackerType:piece.type,attackerName:PIECE_NAMES[piece.type],target,
          victimType:victim.type,victimName:PIECE_NAMES[victim.type],victimValue:PIECE_VALUES[victim.type],
          defended:attackersOf(target,side,board).length>0
        });
      });
    });
    captureThreats.sort((a,b)=>b.victimValue-a.victimValue||a.target.localeCompare(b.target));
    return {
      side,sideName:colorName(side),opponent,opponentName:colorName(opponent),
      inCheck:Boolean(king&&king.attackerCount),threatened,hanging,underdefended,loose,captureThreats,
      kingDanger:{square:king?king.square:null,controlledSquares:controlled,safeNeighborCount:nearby.length-controlled.length}
    };
  }

  return {parseFen,attacksFrom,attackersOf,scan,colorName};
});

