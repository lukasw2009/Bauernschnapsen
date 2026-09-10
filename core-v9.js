(function(root){
'use strict';
const KEY='schnapsen_tracker_v3';
const OLD_KEYS=['bauernschnapsen_tracker_v2','bauernschnapsen_tracker_v1'];
const SCHEMA_VERSION=9;
const clone=v=>JSON.parse(JSON.stringify(v));
const uid=()=>((root.crypto&&root.crypto.randomUUID)?root.crypto.randomUUID():Date.now().toString(36)+'_'+Math.random().toString(36).slice(2));

function preset4(){
  const modifiers=[
    {id:'half',name:'Halbiert',operation:'multiply',value:0.5,rounding:'ceil'},
    {id:'fleck',name:'Gefleckt',operation:'multiply',value:2,rounding:'none'},
    {id:'double',name:'Doppelfleck',operation:'multiply',value:4,rounding:'none'}
  ];
  const all=modifiers.map(m=>m.id);
  return {id:uid(),name:'Bauernschnapsen 4er',players:4,teamSize:2,scoreMode:'down',limit:24,bommerl:2,normalPoints:[1,2,3],normalAllowedModifierIds:[...all],modifiers,
    announcements:[
      {id:uid(),name:'Schnapser',points:6,allowedModifierIds:[...all]},
      {id:uid(),name:'Bettler',points:5,allowedModifierIds:[...all]},
      {id:uid(),name:'Bauernschnapser',points:12,allowedModifierIds:[...all]},
      {id:uid(),name:'Land',points:9,allowedModifierIds:[...all]},
      {id:uid(),name:'Jodler',points:12,allowedModifierIds:[...all]},
      {id:uid(),name:'Kontra-Schnapser',points:12,allowedModifierIds:[]},
      {id:uid(),name:'Kontra-Bauernschnapser',points:24,allowedModifierIds:[]}
    ]};
}
function preset2(){return {id:uid(),name:'Schnapsen 2er · 7',players:2,teamSize:1,scoreMode:'down',limit:7,bommerl:0,normalPoints:[1,2,3],normalAllowedModifierIds:[],modifiers:[],announcements:[]};}
function preset3(){
  const p=preset4();p.id=uid();p.name='3 Spieler · 1 gegen 2';p.players=3;p.teamSize=1;
  p.announcements=p.announcements.filter(a=>!a.name.startsWith('Kontra-')).map(a=>({...a,id:uid()}));return p;
}
function defaultUi(){return {mainPage:'round',morePage:'players',statsTab:'overview',rulesTab:'profiles',historyView:'games',historyFiltersOpen:false,statsFiltersOpen:false,historyProfile:'all',historyPlayer:'all',historyType:'all',historySort:'new',historyCurrent:false,statsProfile:'all',statsPeriod:'all',statsSort:'games',statsScope:'all'};}
function freshState(){const profiles=[preset4(),preset2(),preset3()];return {schemaVersion:SCHEMA_VERSION,players:[],active:[],team1:[],profiles,activeProfileId:profiles[0].id,rounds:[],series:[],endedSessions:[],sessionId:uid(),started:false,startDealerId:null,board:null,ui:defaultUi()};}

function normalizePlayer(p){
  if(typeof p==='string')return {id:uid(),name:p,archived:false};
  return {id:String(p?.id||uid()),name:String(p?.name||'Spieler'),archived:!!p?.archived};
}
function normalizeModifier(m,i){
  return {id:String(m?.id||'m_'+uid()),name:String(m?.name||`Wertung ${i+1}`),operation:['multiply','add'].includes(m?.operation)?m.operation:'multiply',value:Number.isFinite(Number(m?.value))?Number(m.value):1,rounding:['none','ceil','floor','round'].includes(m?.rounding)?m.rounding:'none'};
}
function uniqueId(base,seen,prefix){let id=String(base||prefix+uid());while(seen.has(id))id=prefix+uid();seen.add(id);return id;}
function normalizeIdArray(arr){return [...new Set((Array.isArray(arr)?arr:[]).map(String))];}
function normalizeHistoryBoard(b){
  if(!b||!Array.isArray(b.points))return b?clone(b):null;
  const out=clone(b);out.points=[Number(out.points[0])||0,Number(out.points[1])||0];out.bommerl=Array.isArray(out.bommerl)?[Math.max(0,Number(out.bommerl[0])||0),Math.max(0,Number(out.bommerl[1])||0)]:[0,0];out.over=!!out.over;if(out.dealerId!=null)out.dealerId=String(out.dealerId);return out;
}
function normalizeRoundRecord(r){
  const x=clone(r||{});x.id=String(x.id||uid());x.sessionId=String(x.sessionId||x.id);if(x.profileId!=null)x.profileId=String(x.profileId);x.profileName=String(x.profileName||'Alte Regeln');x.team1=normalizeIdArray(x.team1);x.team2=normalizeIdArray(x.team2);x.winner=Number(x.winner)===2?2:1;x.points=Number.isFinite(Number(x.points))?Math.max(0,Number(x.points)):0;x.type=String(x.type||'Normal');x.modifier=String(x.modifier||'Normal');if(x.dealerId!=null)x.dealerId=String(x.dealerId);if(x.nextDealerId!=null)x.nextDealerId=String(x.nextDealerId);x.beforeBoard=normalizeHistoryBoard(x.beforeBoard);x.reachedBoard=normalizeHistoryBoard(x.reachedBoard);x.afterBoard=normalizeHistoryBoard(x.afterBoard);if(x.bommerlTo!=null)x.bommerlTo=Number(x.bommerlTo)===2?2:1;if(x.seriesWinner!=null)x.seriesWinner=Number(x.seriesWinner)===2?2:1;return x;
}
function normalizeSeriesRecord(r){const x=clone(r||{});x.id=String(x.id||uid());x.sessionId=String(x.sessionId||x.id);if(x.profileId!=null)x.profileId=String(x.profileId);x.profileName=String(x.profileName||'Alte Regeln');x.team1=normalizeIdArray(x.team1);x.team2=normalizeIdArray(x.team2);x.winner=Number(x.winner)===2?2:1;if(Array.isArray(x.bommerl))x.bommerl=[Math.max(0,Number(x.bommerl[0])||0),Math.max(0,Number(x.bommerl[1])||0)];x.finalBoard=normalizeHistoryBoard(x.finalBoard);return x;}
function normalizeEndedRecord(r){const x=clone(r||{});x.id=String(x.id||uid());x.sessionId=String(x.sessionId||x.id);if(x.profileId!=null)x.profileId=String(x.profileId);x.profileName=String(x.profileName||'Alte Regeln');x.team1=normalizeIdArray(x.team1);x.team2=normalizeIdArray(x.team2);x.rounds=Math.max(0,Math.floor(Number(x.rounds)||0));x.reason=String(x.reason||'manual');x.board=normalizeHistoryBoard(x.board);return x;}
function normalizeProfile(input){
  const p=clone(input||{});
  p.id=String(p.id||uid());p.name=String(p.name||'Regelprofil');
  p.players=Math.max(2,Math.min(4,Number(p.players)||4));
  p.teamSize=Math.max(1,Math.min(p.players-1,Number(p.teamSize)||1));
  p.scoreMode=p.scoreMode==='up'?'up':'down';p.limit=Math.max(1,Number(p.limit)||24);p.bommerl=Math.max(0,Math.floor(Number(p.bommerl)||0));
  p.normalPoints=Array.isArray(p.normalPoints)?[...new Set(p.normalPoints.map(Number).filter(n=>Number.isFinite(n)&&n>0))]:[1,2,3];if(!p.normalPoints.length)p.normalPoints=[1];
  if(!Array.isArray(p.modifiers)){
    const old=p.mods||{},mods=[];
    if(old.half)mods.push({id:'half',name:'Halbiert',operation:'multiply',value:.5,rounding:old.halfRound||'ceil'});
    if(old.fleck)mods.push({id:'fleck',name:'Gefleckt',operation:'multiply',value:Number(old.fleckFactor)||2,rounding:'none'});
    if(old.double)mods.push({id:'double',name:'Doppelfleck',operation:'multiply',value:Number(old.doubleFactor)||4,rounding:'none'});
    p.modifiers=mods;
  }
  const modSeen=new Set();p.modifiers=p.modifiers.map(normalizeModifier).map(m=>({...m,id:uniqueId(m.id,modSeen,'m_')}));
  const modIds=p.modifiers.map(m=>m.id);
  if(!Array.isArray(p.normalAllowedModifierIds))p.normalAllowedModifierIds=[...modIds];
  p.normalAllowedModifierIds=p.normalAllowedModifierIds.filter(id=>modIds.includes(id));
  const annSeen=new Set();p.announcements=(Array.isArray(p.announcements)?p.announcements:[]).map((a,i)=>{
    const allowed=Array.isArray(a.allowedModifierIds)?a.allowedModifierIds.map(String):(a.fixed?[]:[...modIds]);
    return {id:uniqueId(a.id||'a_'+uid(),annSeen,'a_'),name:String(a.name||`Ansage ${i+1}`),points:Math.max(0,Number(a.points)||0),allowedModifierIds:[...new Set(allowed.filter(id=>modIds.includes(id)))]};
  });
  delete p.mods;return p;
}
function activeProfile(state){return state.profiles.find(p=>p.id===state.activeProfileId)||state.profiles[0];}
function initialScore(profile){return profile.scoreMode==='down'?profile.limit:0;}
function newBoard(profile,dealerId=null){return {points:[initialScore(profile),initialScore(profile)],bommerl:[0,0],over:false,dealerId:dealerId||null};}
function normalizeBoard(board,profile,dealerId){
  const b=(board&&Array.isArray(board.points)&&Array.isArray(board.bommerl))?clone(board):newBoard(profile,dealerId);
  b.points=[Number(b.points[0])||0,Number(b.points[1])||0];b.bommerl=[Math.max(0,Number(b.bommerl[0])||0),Math.max(0,Number(b.bommerl[1])||0)];b.over=!!b.over;b.dealerId=b.dealerId||dealerId||null;return b;
}
function migrateState(raw){
  const base=freshState();
  if(!raw||typeof raw!=='object')return base;
  const s={...base,...clone(raw)};
  s.players=(Array.isArray(raw.players)?raw.players:[]).map(normalizePlayer);
  s.profiles=(Array.isArray(raw.profiles)&&raw.profiles.length?raw.profiles:base.profiles).map(normalizeProfile);
  const requestedProfile=raw.activeProfileId!=null?String(raw.activeProfileId):null;
  s.activeProfileId=s.profiles.some(p=>p.id===requestedProfile)?requestedProfile:s.profiles[0].id;
  const ids=new Set(s.players.map(p=>p.id)),pNow=activeProfile(s);
  s.active=normalizeIdArray(raw.active).filter(id=>ids.has(id)).slice(0,pNow.players);
  s.team1=normalizeIdArray(raw.team1).filter(id=>s.active.includes(id)).slice(0,pNow.teamSize);
  s.rounds=(Array.isArray(raw.rounds)?raw.rounds:[]).map(normalizeRoundRecord);s.series=(Array.isArray(raw.series)?raw.series:[]).map(normalizeSeriesRecord);s.endedSessions=(Array.isArray(raw.endedSessions)?raw.endedSessions:[]).map(normalizeEndedRecord);
  s.sessionId=String(raw.sessionId||uid());s.started=!!raw.started;
  const requestedDealer=raw.startDealerId!=null?String(raw.startDealerId):null;
  s.startDealerId=s.active.includes(requestedDealer)?requestedDealer:(s.active[0]||null);
  s.board=normalizeBoard(raw.board,pNow,s.startDealerId);
  if(s.board.dealerId!=null)s.board.dealerId=String(s.board.dealerId);
  if(s.board.dealerId&&!s.active.includes(s.board.dealerId))s.board.dealerId=s.startDealerId;
  s.ui={...defaultUi(),...(raw.ui||{})};
  // map older UI property names from v8 and the intermediate single-file build
  const oldPage=raw.ui?.v8Page??raw.ui?.page;if(oldPage)s.ui.mainPage=oldPage==='game'?'round':oldPage;
  if(raw.ui?.v8More??raw.ui?.more)s.ui.morePage=raw.ui?.v8More??raw.ui?.more;
  if(raw.ui?.v8Stats??raw.ui?.statsTab)s.ui.statsTab=raw.ui?.v8Stats??raw.ui?.statsTab;
  const oldRules=raw.ui?.v8Rules??raw.ui?.rulesTab;if(oldRules)s.ui.rulesTab=oldRules==='profile'?'profiles':oldRules;
  if(typeof raw.ui?.v8HistoryFilters==='boolean')s.ui.historyFiltersOpen=raw.ui.v8HistoryFilters;else if(typeof raw.ui?.historyFilters==='boolean')s.ui.historyFiltersOpen=raw.ui.historyFilters;
  if(typeof raw.ui?.v8StatsFilters==='boolean')s.ui.statsFiltersOpen=raw.ui.v8StatsFilters;else if(typeof raw.ui?.statsFilters==='boolean')s.ui.statsFiltersOpen=raw.ui.statsFilters;
  if(!['round','score','history','stats','more'].includes(s.ui.mainPage))s.ui.mainPage='round';
  if(!['players','rules','data'].includes(s.ui.morePage))s.ui.morePage='players';
  if(!['overview','players','teams','types'].includes(s.ui.statsTab))s.ui.statsTab='overview';
  if(!['profiles','general','modifiers','announcements'].includes(s.ui.rulesTab))s.ui.rulesTab='profiles';
  if(s.started&&!ready(s))s.started=false;
  s.schemaVersion=SCHEMA_VERSION;return s;
}
function load(){
  if(!root.localStorage)return freshState();
  try{
    const cur=root.localStorage.getItem(KEY);if(cur)return migrateState(JSON.parse(cur));
    for(const k of OLD_KEYS){const v=root.localStorage.getItem(k);if(v){const old=JSON.parse(v),s=freshState();s.players=(old.players||[]).map(normalizePlayer);s.active=(old.active||[]);s.team1=(old.team1||[]);s.rounds=Array.isArray(old.rounds)?old.rounds:[];s.series=Array.isArray(old.series)?old.series:[];return migrateState(s);}}
  }catch(e){}
  return freshState();
}
function save(state){state.schemaVersion=SCHEMA_VERSION;if(root.localStorage)root.localStorage.setItem(KEY,JSON.stringify(state));}
function playerName(state,id){return state.players.find(p=>p.id===id)?.name||'Unbekannt';}
function side2(state){return state.active.filter(id=>!state.team1.includes(id));}
function ready(state){const p=activeProfile(state);return state.active.length===p.players&&state.team1.length===p.teamSize&&side2(state).length===p.players-p.teamSize;}
function currentSessionRounds(state){return state.rounds.filter(r=>r.sessionId===state.sessionId);}
function currentDealer(state){return state.board?.dealerId&&state.active.includes(state.board.dealerId)?state.board.dealerId:(state.startDealerId&&state.active.includes(state.startDealerId)?state.startDealerId:(state.active[0]||null));}
function nextDealer(state,id){if(!state.active.length)return null;const i=state.active.indexOf(id);return state.active[(i<0?0:i+1)%state.active.length];}
function applyRounding(v,mode){if(mode==='ceil')return Math.ceil(v);if(mode==='floor')return Math.floor(v);if(mode==='round')return Math.round(v);return Math.round(v*1000)/1000;}
function roundInfo(state,{announcementId='__normal',normalPoints=1,modifierId='base'}={}){
  const p=activeProfile(state);let name='Normal',base=Number(normalPoints)||p.normalPoints[0]||1,allowed=p.normalAllowedModifierIds||[];
  if(announcementId!=='__normal'){
    const a=p.announcements.find(x=>x.id===announcementId);if(a){name=a.name;base=Number(a.points)||0;allowed=a.allowedModifierIds||[];}else announcementId='__normal';
  }
  let points=base,modifierName='Normal',effectiveModifierId='base';
  if(modifierId!=='base'&&allowed.includes(modifierId)){
    const m=p.modifiers.find(x=>x.id===modifierId);if(m){points=m.operation==='add'?points+Number(m.value||0):points*Number(m.value||0);points=applyRounding(points,m.rounding);if(!Number.isFinite(points))points=0;points=Math.max(0,points);modifierName=m.name;effectiveModifierId=m.id;}
  }
  return {announcementId,name,basePoints:base,allowedModifierIds:[...allowed],modifierId:effectiveModifierId,modifierName,points};
}
function goalReached(profile,board,side){const v=board.points[side-1];return profile.scoreMode==='down'?v<=0:v>=profile.limit;}
function teamSnapshot(state){return {team1:[...state.team1],team2:[...side2(state)]};}
function applyRound(state,{winner,announcementId='__normal',normalPoints=1,modifierId='base'}){
  if(!state.started||!ready(state)||state.board?.over||![1,2].includes(winner))return null;
  const p=activeProfile(state),info=roundInfo(state,{announcementId,normalPoints,modifierId}),teams=teamSnapshot(state),before=clone(state.board),dealer=currentDealer(state);
  if(p.scoreMode==='down')state.board.points[winner-1]=Math.max(0,state.board.points[winner-1]-info.points);else state.board.points[winner-1]=Math.min(p.limit,state.board.points[winner-1]+info.points);
  const reached=clone(state.board);let bommerlTo=null,seriesWinner=null;
  if(goalReached(p,state.board,winner)){
    const loser=winner===1?2:1;
    if(p.bommerl>0){bommerlTo=loser;state.board.bommerl[loser-1]++;if(state.board.bommerl[loser-1]>=p.bommerl){state.board.over=true;seriesWinner=winner;}else state.board.points=[initialScore(p),initialScore(p)];}
    else {state.board.over=true;seriesWinner=winner;}
  }
  const next=nextDealer(state,dealer);state.board.dealerId=next;
  const after=clone(state.board),at=new Date().toISOString();
  if(seriesWinner){
    state.series.unshift({id:uid(),sessionId:state.sessionId,at,profileId:p.id,profileName:p.name,team1:[...teams.team1],team2:[...teams.team2],winner:seriesWinner,bommerl:[...state.board.bommerl],finalBoard:clone(state.board)});
  }
  const r={id:uid(),sessionId:state.sessionId,at,profileId:p.id,profileName:p.name,type:info.name,announcementId:info.announcementId,basePoints:info.basePoints,modifier:info.modifierName,modifierId:info.modifierId,points:info.points,team1:teams.team1,team2:teams.team2,winner,beforeBoard:before,reachedBoard:reached,afterBoard:after,bommerlTo,seriesWinner,dealerId:dealer,nextDealerId:next};
  state.rounds.unshift(r);return r;
}
function recordEnded(state,reason='manual'){
  if(!state.started)return null;const rounds=currentSessionRounds(state);if(!rounds.length||state.board?.over)return null;
  if(state.endedSessions.some(s=>s.sessionId===state.sessionId)||state.series.some(s=>s.sessionId===state.sessionId))return null;
  const p=activeProfile(state),teams=teamSnapshot(state),e={id:uid(),sessionId:state.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,team1:teams.team1,team2:teams.team2,board:clone(state.board),rounds:rounds.length,reason};state.endedSessions.unshift(e);return e;
}
function startGame(state){if(!ready(state))return false;state.sessionId=uid();state.started=true;state.startDealerId=state.active.includes(state.startDealerId)?state.startDealerId:(state.active[0]||null);state.board=newBoard(activeProfile(state),state.startDealerId);return true;}
function startNewGame(state){if(!ready(state))return false;if(state.started&&!state.board?.over)recordEnded(state,'newGame');state.sessionId=uid();state.started=true;state.startDealerId=state.active.includes(state.startDealerId)?state.startDealerId:(state.active[0]||null);state.board=newBoard(activeProfile(state),state.startDealerId);return true;}
function stopToSetup(state,reason='setupChanged'){if(state.started&&!state.board?.over)recordEnded(state,reason);state.started=false;state.sessionId=uid();state.board=newBoard(activeProfile(state),state.startDealerId||state.active[0]||null);return true;}
function manualEnd(state){if(!state.started||state.board?.over)return false;recordEnded(state,'manual');state.started=false;state.sessionId=uid();state.board=newBoard(activeProfile(state),state.startDealerId||state.active[0]||null);return true;}
function undoLastRound(state){const r=state.rounds[0];if(!r||r.sessionId!==state.sessionId)return null;state.rounds.shift();state.board=clone(r.beforeBoard||newBoard(activeProfile(state),r.dealerId||state.startDealerId));if(r.seriesWinner){const i=state.series.findIndex(s=>s.sessionId===r.sessionId);if(i>=0)state.series.splice(i,1);}return r;}
function changeProfile(state,id){id=String(id);if(state.started||!state.profiles.some(p=>p.id===id))return false;if(state.activeProfileId===id)return true;state.activeProfileId=id;state.active=[];state.team1=[];state.startDealerId=null;state.sessionId=uid();state.board=newBoard(activeProfile(state),null);return true;}
function scorePair(board){return board?.points?.length===2?`${board.points[0]} : ${board.points[1]}`:'—';}

const api={KEY,SCHEMA_VERSION,uid,clone,preset4,preset2,preset3,defaultUi,freshState,normalizeProfile,migrateState,load,save,activeProfile,initialScore,newBoard,playerName,side2,ready,currentSessionRounds,currentDealer,nextDealer,roundInfo,applyRound,recordEnded,startGame,startNewGame,stopToSetup,manualEnd,undoLastRound,changeProfile,teamSnapshot,scorePair};
root.SchnapsenCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
