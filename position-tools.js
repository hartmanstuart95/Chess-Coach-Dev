(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessPositionTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FILES='abcdefgh';
  const PIECES='prnbqkPRNBQK';

  function parseFen(fen){
    if(typeof fen!=='string')throw new Error('Enter a FEN position.');
    const parts=fen.trim().split(/\s+/);
    if(parts.length!==6)throw new Error('FEN must contain six fields.');
    const rows=parts[0].split('/');
    if(rows.length!==8)throw new Error('FEN must contain eight ranks.');
    const pieces={};
    rows.forEach((row,rowIndex)=>{
      let file=0;
      for(const char of row){
        if(/[1-8]/.test(char)){file+=Number(char);continue;}
        if(!PIECES.includes(char)||file>7)throw new Error('FEN contains an invalid piece layout.');
        pieces[FILES[file]+(8-rowIndex)]={color:char===char.toUpperCase()?'w':'b',type:char.toLowerCase()};file++;
      }
      if(file!==8)throw new Error('Every FEN rank must contain eight squares.');
    });
    if(!/^[wb]$/.test(parts[1]))throw new Error('FEN side to move must be w or b.');
    if(!/^(-|K?Q?k?q?)$/.test(parts[2]))throw new Error('FEN castling rights are invalid.');
    if(!/^(-|[a-h][36])$/.test(parts[3]))throw new Error('FEN en passant square is invalid.');
    if(!/^\d+$/.test(parts[4])||!/^\d+$/.test(parts[5])||Number(parts[5])<1)throw new Error('FEN move counters are invalid.');
    return {pieces,turn:parts[1],castling:parts[2],enPassant:parts[3],halfmove:Number(parts[4]),fullmove:Number(parts[5])};
  }

  function buildFen(position){
    const rows=[];
    for(let rank=8;rank>=1;rank--){
      let row='',empty=0;
      for(const file of FILES){
        const piece=position.pieces[file+rank];
        if(!piece){empty++;continue;}
        if(empty){row+=empty;empty=0;}
        const symbol=piece.type.toLowerCase();
        if(!'prnbqk'.includes(symbol)||!['w','b'].includes(piece.color))throw new Error('Position contains an invalid piece.');
        row+=piece.color==='w'?symbol.toUpperCase():symbol;
      }
      if(empty)row+=empty;rows.push(row);
    }
    return rows.join('/')+' '+position.turn+' '+(position.castling||'-')+' '+(position.enPassant||'-')+' '+(position.halfmove||0)+' '+(position.fullmove||1);
  }

  function legalCastlingRights(position){
    const pieces=position.pieces||{};
    const has=(square,color,type)=>pieces[square]?.color===color&&pieces[square]?.type===type;
    const requested=typeof position.castling==='string'?position.castling:'';
    let rights='';
    if(requested.includes('K')&&has('e1','w','k')&&has('h1','w','r'))rights+='K';
    if(requested.includes('Q')&&has('e1','w','k')&&has('a1','w','r'))rights+='Q';
    if(requested.includes('k')&&has('e8','b','k')&&has('h8','b','r'))rights+='k';
    if(requested.includes('q')&&has('e8','b','k')&&has('a8','b','r'))rights+='q';
    return rights||'-';
  }

  function normalizeFen(fen){
    const position=parseFen(fen);
    position.castling=legalCastlingRights(position);
    return buildFen(position);
  }

  function validate(position){
    const pieces=Object.entries(position.pieces||{});
    const whiteKings=pieces.filter(([,p])=>p.color==='w'&&p.type==='k').length;
    const blackKings=pieces.filter(([,p])=>p.color==='b'&&p.type==='k').length;
    if(whiteKings!==1||blackKings!==1)return {valid:false,message:'Position needs exactly one white king and one black king.'};
    if(pieces.some(([square,p])=>p.type==='p'&&(square[1]==='1'||square[1]==='8')))return {valid:false,message:'Pawns cannot be placed on the first or eighth rank.'};
    if(!['w','b'].includes(position.turn))return {valid:false,message:'Choose which side moves first.'};
    try{
      const castling=legalCastlingRights(position);
      const fen=buildFen({...position,castling});
      return castling===(position.castling||'-')?{valid:true,fen}:{valid:true,fen,castlingAdjusted:true};
    }catch(e){return {valid:false,message:e.message};}
  }

  return {parseFen,buildFen,legalCastlingRights,normalizeFen,validate};
});

