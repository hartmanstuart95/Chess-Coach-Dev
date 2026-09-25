(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.ChessOpeningPractice=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STORAGE_KEY='chessCoachOpeningPractice_v1';
  const OPENINGS=[
    {id:'london-main',name:'London System',eco:'D02',moves:['d4','d5','Nf3','Nf6','Bf4','e6','e3','Bd6','Bg3','O-O','Bd3','c5']},
    {id:'london-kingside',name:'London System vs Kingside Fianchetto',eco:'D02',moves:['d4','Nf6','Nf3','g6','Bf4','Bg7','e3','O-O','Be2','d6','O-O']},
    {id:'jobava-london',name:'Jobava London',eco:'D00',moves:['d4','d5','Nc3','Nf6','Bf4']},
    {id:'queens-gambit',name:"Queen's Gambit",eco:'D06',moves:['d4','d5','c4']},
    {id:'qgd',name:"Queen's Gambit Declined",eco:'D30',moves:['d4','d5','c4','e6','Nc3','Nf6']},
    {id:'slav',name:'Slav Defense',eco:'D10',moves:['d4','d5','c4','c6']},
    {id:'kings-indian',name:"King's Indian Defense",eco:'E60',moves:['d4','Nf6','c4','g6','Nc3','Bg7','e4','d6']},
    {id:'nimzo-indian',name:'Nimzo-Indian Defense',eco:'E20',moves:['d4','Nf6','c4','e6','Nc3','Bb4']},
    {id:'italian',name:'Italian Game',eco:'C50',moves:['e4','e5','Nf3','Nc6','Bc4']},
    {id:'giuoco-piano',name:'Giuoco Piano',eco:'C50',moves:['e4','e5','Nf3','Nc6','Bc4','Bc5']},
    {id:'ruy-lopez',name:'Ruy Lopez',eco:'C60',moves:['e4','e5','Nf3','Nc6','Bb5']},
    {id:'scotch',name:'Scotch Game',eco:'C44',moves:['e4','e5','Nf3','Nc6','d4']},
    {id:'four-knights',name:'Four Knights Game',eco:'C47',moves:['e4','e5','Nf3','Nc6','Nc3','Nf6']},
    {id:'sicilian',name:'Sicilian Defense',eco:'B20',moves:['e4','c5']},
    {id:'open-sicilian',name:'Sicilian Defense — Open',eco:'B20',moves:['e4','c5','Nf3','d6','d4','cxd4','Nxd4']},
    {id:'caro-kann',name:'Caro-Kann Defense',eco:'B10',moves:['e4','c6','d4','d5']},
    {id:'french',name:'French Defense',eco:'C00',moves:['e4','e6','d4','d5']},
    {id:'scandinavian',name:'Scandinavian Defense',eco:'B01',moves:['e4','d5']},
    {id:'alekhine',name:"Alekhine's Defense",eco:'B02',moves:['e4','Nf6']},
    {id:'pirc',name:'Pirc Defense',eco:'B07',moves:['e4','d6','d4','Nf6','Nc3','g6']},
    {id:'english',name:'English Opening',eco:'A10',moves:['c4']},
    {id:'reti',name:'Réti Opening',eco:'A04',moves:['Nf3','d5','g3']},
    {id:'kings-gambit',name:"King's Gambit",eco:'C30',moves:['e4','e5','f4']},
    {id:'danish-gambit',name:'Danish Gambit',eco:'C21',moves:['e4','e5','d4','exd4','c3']},
    {id:'vienna',name:'Vienna Game',eco:'C25',moves:['e4','e5','Nc3']}
  ];

  function cleanSan(value){return String(value||'').replace(/[+#?!]+$/g,'');}
  function findOpening(id){return OPENINGS.find(opening=>opening.id===id)||null;}
  function isUserTurn(index,side){return side==='both'||(index%2===0?'w':'b')===side;}
  function isCorrect(expected,played){return cleanSan(expected)===cleanSan(played);}

  function findMatch(moves){
    if(!Array.isArray(moves)||!moves.length)return null;
    const gameMoves=moves.map(cleanSan);let best=null;
    OPENINGS.forEach(line=>{
      let matched=0;
      for(let i=0;i<Math.min(gameMoves.length,line.moves.length);i++){
        if(gameMoves[i]!==cleanSan(line.moves[i]))break;
        matched++;
      }
      const minimum=line.moves.length<=2?2:Math.min(3,line.moves.length);
      if(matched>=minimum&&(!best||matched>best.matched||(matched===best.matched&&line.moves.length>best.moves.length)))best={...line,matched};
    });
    return best;
  }

  function createProgressStore(storage,options={}){
    const now=typeof options.now==='function'?options.now:Date.now;
    function read(){
      try{
        const value=JSON.parse(storage.getItem(STORAGE_KEY)||'{}');
        if(!value||typeof value!=='object'||Array.isArray(value))return {};
        const clean={};
        Object.entries(value).forEach(([id,row])=>{
          if(findOpening(id)&&row&&Number.isInteger(row.attempts)&&row.attempts>=0&&Number.isInteger(row.correct)&&row.correct>=0&&row.correct<=row.attempts&&Number.isInteger(row.completions)&&row.completions>=0)clean[id]=row;
        });
        return clean;
      }catch(e){return {};}
    }
    function write(value){try{storage.setItem(STORAGE_KEY,JSON.stringify(value));return true;}catch(e){return false;}}
    function get(id){return read()[id]||{attempts:0,correct:0,completions:0,lastPracticed:0};}
    function recordAttempt(id,correct){
      if(!findOpening(id))return null;
      const all=read(),row=get(id),next={...row,attempts:row.attempts+1,correct:row.correct+(correct?1:0),lastPracticed:now()};
      all[id]=next;return write(all)?next:null;
    }
    function recordCompletion(id){
      if(!findOpening(id))return null;
      const all=read(),row=get(id),next={...row,completions:row.completions+1,lastPracticed:now()};
      all[id]=next;return write(all)?next:null;
    }
    return {get,recordAttempt,recordCompletion,key:STORAGE_KEY};
  }

  return {STORAGE_KEY,OPENINGS,cleanSan,findOpening,findMatch,isUserTurn,isCorrect,createProgressStore};
});

