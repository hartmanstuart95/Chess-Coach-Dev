const test=require('node:test');
const assert=require('node:assert/strict');
const Dashboard=require('../progress-dashboard.js');

function memoryStorage(){const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};}

test('stores only a valid Chess.com username',()=>{
  const store=Dashboard.createConnectionStore(memoryStorage());
  assert.equal(store.save('  Player_One  '),'Player_One');
  assert.equal(store.get(),'Player_One');
  assert.equal(store.save('bad name'),null);
  store.remove();assert.equal(store.get(),null);
});

test('extracts current and best ratings safely',()=>{
  const ratings=Dashboard.ratingSummary({chess_rapid:{last:{rating:1420},best:{rating:1502}},chess_blitz:{last:{rating:1301}}});
  assert.deepEqual(ratings,[{label:'Rapid',rating:1420,best:1502},{label:'Blitz',rating:1301,best:null},{label:'Bullet',rating:null,best:null}]);
});

test('summarizes recent games from the connected player perspective',()=>{
  const games=[
    {end_time:3,time_class:'rapid',white:{username:'CoachUser',rating:1400,result:'win'},black:{username:'Other',rating:1390,result:'checkmated'}},
    {end_time:2,time_class:'blitz',white:{username:'Other',rating:1300,result:'win'},black:{username:'coachuser',rating:1310,result:'resigned'}},
    {end_time:1,time_class:'rapid',white:{username:'CoachUser',rating:1401,result:'agreed'},black:{username:'Other',rating:1400,result:'agreed'}}
  ];
  const summary=Dashboard.summarizeGames(games,'CoachUser');
  assert.deepEqual({games:summary.games,wins:summary.wins,losses:summary.losses,draws:summary.draws,winRate:summary.winRate},{games:3,wins:1,losses:1,draws:1,winRate:33});
});

test('totals local opening practice progress',()=>{
  const openings=[{id:'a'},{id:'b'}],store={get:id=>id==='a'?{attempts:3,correct:2,completions:1}:{attempts:2,correct:2,completions:4}};
  assert.deepEqual(Dashboard.localOpeningTotals(openings,store),{attempts:5,correct:4,completions:5,accuracy:80});
});

