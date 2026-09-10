'use strict';
(function(){
const KEY='schnapsen_tracker_v3', V2='bauernschnapsen_tracker_v2', V1='bauernschnapsen_tracker_v1';
const $=id=>document.getElementById(id), $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random().toString(36).slice(2);
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const nowIso=()=>new Date().toISOString();

function preset4(){
 const mods=[
  {id:'half',name:'Halbiert',operation:'multiply',value:.5,rounding:'ceil'},
  {id:'fleck',name:'Gefleckt',operation:'multiply',value:2,rounding:'none'},
  {id:'double',name:'Doppelfleck',operation:'multiply',value:4,rounding:'none'}
 ];
 const all=mods.map(m=>m.id);
 return{id:uid(),name:'Bauernschnapsen 4er',players:4,teamSize:2,scoreMode:'down',limit:24,bommerl:2,normalPoints:[1,2,3],modifiers:mods,announcements:[
  {name:'Schnapser',points:6,allowedModifierIds:[...all]},
  {name:'Bettler',points:5,allowedModifierIds:[...all]},
  {name:'Bauernschnapser',points:12,allowedModifierIds:[...all]},
  {name:'Land',points:9,allowedModifierIds:[...all]},
  {name:'Jodler',points:12,allowedModifierIds:[...all]},
  {name:'Kontra-Schnapser',points:12,allowedModifierIds:[]},
  {name:'Kontra-Bauernschnapser',points:24,allowedModifierIds:[]}
 ]};
}
function preset2(){return{id:uid(),name:'Schnapsen 2er · 7',players:2,teamSize:1,scoreMode:'down',limit:7,bommerl:0,normalPoints:[1,2,3],modifiers:[],announcements:[]}}
function preset3(){
 const mods=[{id:'half',name:'Halbiert',operation:'multiply',value:.5,rounding:'ceil'},{id:'fleck',name:'Gefleckt',operation:'multiply',value:2,rounding:'none'},{id:'double',name:'Doppelfleck',operation:'multiply',value:4,rounding:'none'}];
 const all=mods.map(m=>m.id);
 return{id:uid(),name:'3 Spieler · 1 gegen 2',players:3,teamSize:1,scoreMode:'down',limit:24,bommerl:2,normalPoints:[1,2,3],modifiers:mods,announcements:[
  {name:'Schnapser',points:6,allowedModifierIds:[...all]},{name:'Bettler',points:5,allowedModifierIds:[...all]},{name:'Bauernschnapser',points:12,allowedModifierIds:[...all]},{name:'Land',points:9,allowedModifierIds:[...all]},{name:'Jodler',points:12,allowedModifierIds:[...all]}
 ]};
}
function uiDefaults(){return{page:'game',more:'players',statsTab:'overview',rulesTab:'profile',historyFilters:false,statsFilters:false,historyProfile:'all',historyPlayer:'all',historyType:'all',historySort:'new',historyView:'games',historyCurrent:false,statsProfile:'all',statsPeriod:'all',statsSort:'games',statsScope:'all'}}
function normalizeUi(ui){
 const d=Object.assign(uiDefaults(),ui||{});
 if(d.page==='round')d.page='game';
 if(!['game','score','history','stats','more'].includes(d.page))d.page='game';
 if(!['players','rules','data'].includes(d.more))d.more='players';
 if(!['overview','players','teams','types'].includes(d.statsTab))d.statsTab='overview';
 if(!['profile','general','modifiers','announcements'].includes(d.rulesTab))d.rulesTab='profile';
 if(!['new','old'].includes(d.historySort))d.historySort='new';
 if(!['games','rounds'].includes(d.historyView))d.historyView='games';
 if(!['all','today','7','30'].includes(String(d.statsPeriod)))d.statsPeriod='all';
 if(!['games','wins','rate','points'].includes(d.statsSort))d.statsSort='games';
 if(!['all','current'].includes(d.statsScope))d.statsScope='all';
 d.historyFilters=!!d.historyFilters;d.statsFilters=!!d.statsFilters;d.historyCurrent=!!d.historyCurrent;
 d.historyProfile=String(d.historyProfile||'all');d.historyPlayer=String(d.historyPlayer||'all');d.historyType=String(d.historyType||'all');d.statsProfile=String(d.statsProfile||'all');
 return d;
}
function fresh(){const profiles=[preset4(),preset2(),preset3()];return{schema:10,players:[],active:[],team1:[],rounds:[],series:[],endedSessions:[],profiles,activeProfileId:profiles[0].id,board:null,sessionId:uid(),started:false,startDealerId:null,ui:uiDefaults()}}

function migrateProfile(p){
 if(!p||typeof p!=='object')return preset4();
 p.id=String(p.id||uid());p.name=String(p.name||'Regelprofil');
 p.players=Math.max(2,Math.min(4,Number(p.players)||4));
 p.teamSize=Math.max(1,Math.min(p.players-1,Number(p.teamSize)||1));
 p.scoreMode=p.scoreMode==='up'?'up':'down';
 p.limit=Math.max(1,Number(p.limit)||24);p.bommerl=Math.max(0,Number(p.bommerl)||0);
 p.normalPoints=Array.isArray(p.normalPoints)?[...new Set(p.normalPoints.map(Number).filter(n=>Number.isFinite(n)&&n>0))]:[1,2,3];if(!p.normalPoints.length)p.normalPoints=[1];
 if(!Array.isArray(p.modifiers)){
  const mods=[];
  if(p.mods?.half)mods.push({id:'half',name:'Halbiert',operation:'multiply',value:.5,rounding:p.mods.halfRound||'ceil'});
  if(p.mods?.fleck)mods.push({id:'fleck',name:'Gefleckt',operation:'multiply',value:Number(p.mods.fleckFactor)||2,rounding:'none'});
  if(p.mods?.double)mods.push({id:'double',name:'Doppelfleck',operation:'multiply',value:Number(p.mods.doubleFactor)||4,rounding:'none'});
  p.modifiers=mods;
 }
 const seen=new Set();
 p.modifiers=p.modifiers.map((m,i)=>{
  let id=String(m?.id||'m_'+uid()).replace(/\s/g,'_');while(seen.has(id))id+='_'+i;seen.add(id);
  return{id,name:String(m?.name||`Wertung ${i+1}`),operation:m?.operation==='add'?'add':'multiply',value:Number.isFinite(Number(m?.value))?Number(m.value):1,rounding:['none','ceil','floor','round'].includes(m?.rounding)?m.rounding:'none'}
 });
 p.announcements=Array.isArray(p.announcements)?p.announcements:[];
 p.announcements=p.announcements.map(a=>{
  let allowed=Array.isArray(a.allowedModifierIds)?a.allowedModifierIds.map(String):((a.fixed===true)?[]:p.modifiers.map(m=>m.id));
  allowed=allowed.filter(id=>p.modifiers.some(m=>m.id===id));
  return{name:String(a.name||'Ansage'),points:Math.max(0,Number(a.points)||0),allowedModifierIds:[...new Set(allowed)]};
 }).filter(a=>a.name.trim());
 return p;
}
function normalizeData(d){
 if(!d||typeof d!=='object')d=fresh();
 if(!Array.isArray(d.profiles)||!d.profiles.length)d.profiles=[preset4(),preset2(),preset3()];
 const profileIds=new Set();d.profiles=d.profiles.map(migrateProfile).map(p=>{if(profileIds.has(p.id))p.id=uid();profileIds.add(p.id);return p});
 d.activeProfileId=String(d.activeProfileId||'');if(!d.profiles.some(p=>p.id===d.activeProfileId))d.activeProfileId=d.profiles[0].id;
 const playerIds=new Set();d.players=(Array.isArray(d.players)?d.players:[]).map(p=>{let id=String(p?.id||uid());if(playerIds.has(id))id=uid();playerIds.add(id);return{id,name:String(p?.name||'Spieler'),archived:!!p?.archived}});
 d.active=Array.isArray(d.active)?[...new Set(d.active.map(String))].filter(id=>d.players.some(p=>p.id===id)):[];
 d.team1=Array.isArray(d.team1)?[...new Set(d.team1.map(String))].filter(id=>d.active.includes(id)):[];
 d.rounds=Array.isArray(d.rounds)?d.rounds:[];d.series=Array.isArray(d.series)?d.series:[];d.endedSessions=Array.isArray(d.endedSessions)?d.endedSessions:[];
 d.sessionId=String(d.sessionId||uid());d.started=!!d.started;d.startDealerId=d.startDealerId?String(d.startDealerId):null;
 d.ui=normalizeUi(d.ui);d.schema=10;
 const p=d.profiles.find(x=>x.id===d.activeProfileId)||d.profiles[0];
 if(!d.started){d.active=d.active.filter(id=>!d.players.find(pl=>pl.id===id)?.archived);d.team1=d.team1.filter(id=>d.active.includes(id));}
 const validSetup=d.active.length===p.players&&d.team1.length===p.teamSize&&d.active.filter(id=>!d.team1.includes(id)).length===p.players-p.teamSize;
 if(d.started&&!validSetup)d.started=false;
 const initial=p.scoreMode==='down'?p.limit:0;
 if(!d.board||!Array.isArray(d.board.points)||d.board.points.length!==2)d.board={points:[initial,initial],bommerl:[0,0],over:false,dealerId:d.startDealerId||d.active[0]||null};
 d.board.points=d.board.points.map(n=>Number.isFinite(Number(n))?Number(n):initial);
 d.board.bommerl=Array.isArray(d.board.bommerl)&&d.board.bommerl.length===2?d.board.bommerl.map(n=>Math.max(0,Number(n)||0)):[0,0];d.board.over=!!d.board.over;
 if(!d.board.dealerId||!d.active.includes(String(d.board.dealerId)))d.board.dealerId=d.startDealerId&&d.active.includes(d.startDealerId)?d.startDealerId:(d.active[0]||null);
 if(!d.startDealerId||!d.active.includes(d.startDealerId))d.startDealerId=d.active[0]||null;
 d.rounds.forEach(r=>{r.team1=Array.isArray(r.team1)?r.team1.map(String):[];r.team2=Array.isArray(r.team2)?r.team2.map(String):[];r.winner=Number(r.winner)||0;r.points=Number(r.points)||0;if(r.dealerId)r.dealerId=String(r.dealerId);if(r.profileId)r.profileId=String(r.profileId);if(r.sessionId)r.sessionId=String(r.sessionId)});
 d.series.forEach(s=>{s.team1=Array.isArray(s.team1)?s.team1.map(String):[];s.team2=Array.isArray(s.team2)?s.team2.map(String):[];s.winner=Number(s.winner)||0;if(s.profileId)s.profileId=String(s.profileId);if(s.sessionId)s.sessionId=String(s.sessionId)});
 d.endedSessions.forEach(s=>{s.team1=Array.isArray(s.team1)?s.team1.map(String):[];s.team2=Array.isArray(s.team2)?s.team2.map(String):[];if(s.profileId)s.profileId=String(s.profileId);if(s.sessionId)s.sessionId=String(s.sessionId)});
 if(d.ui.historyPlayer!=='all'&&!d.players.some(p=>p.id===d.ui.historyPlayer))d.ui.historyPlayer='all';
 return d;
}
function load(){
 try{const x=JSON.parse(localStorage.getItem(KEY));if(x)return normalizeData(x)}catch{}
 const n=fresh();
 try{const v2=JSON.parse(localStorage.getItem(V2));if(v2){Object.assign(n,{players:v2.players||[],active:v2.active||[],team1:v2.team1||[],rounds:v2.rounds||[],series:v2.series||[]});return normalizeData(n)}}catch{}
 try{const v1=JSON.parse(localStorage.getItem(V1));if(v1?.players){n.players=v1.players;return normalizeData(n)}}catch{}
 return normalizeData(n);
}
let data=load();
let selectedNormal=1, selectedModifier='base', selectedGame='__normal', submitLockedUntil=0;
let ruleDraft=null, ruleDirty=false;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}};
const removeSaved=()=>{try{localStorage.removeItem(KEY)}catch{}};
save();

function player(id){return data.players.find(p=>p.id===id)}
function pname(id){return player(id)?.name||'Unbekannt'}
function profile(){return data.profiles.find(p=>p.id===data.activeProfileId)||data.profiles[0]}
function side2(){return data.active.filter(id=>!data.team1.includes(id))}
function ready(){const p=profile();return data.active.length===p.players&&data.team1.length===p.teamSize&&side2().length===p.players-p.teamSize}
function initialScore(p=profile()){return p.scoreMode==='down'?p.limit:0}
function blankBoard(dealerId=null){return{points:[initialScore(),initialScore()],bommerl:[0,0],over:false,dealerId:dealerId&&data.active.includes(dealerId)?dealerId:(data.startDealerId&&data.active.includes(data.startDealerId)?data.startDealerId:(data.active[0]||null))}}
function scorePair(board){return board&&Array.isArray(board.points)?`${fmt(board.points[0])} : ${fmt(board.points[1])}`:'—'}
function fmt(n){return Number.isInteger(Number(n))?String(Number(n)):String(Math.round(Number(n)*100)/100)}
function teamSnapshot(){return{team1:[...data.team1],team2:[...side2()]}}
function nextDealer(id){if(!data.active.length)return null;const i=data.active.indexOf(id);return data.active[(i<0?0:i+1)%data.active.length]}
function currentDealer(){return data.board?.dealerId&&data.active.includes(data.board.dealerId)?data.board.dealerId:(data.startDealerId||data.active[0]||null)}
function goalReached(side){const p=profile(),v=data.board.points[side-1];return p.scoreMode==='down'?v<=0:v>=p.limit}
function bombText(n){const max=profile().bommerl;if(!max)return'ohne Bommerl';return'Bommerl: '+Array.from({length:max},(_,i)=>i<n?'●':'○').join(' ')}
function roundFlow(r){const before=scorePair(r.beforeBoard),reached=scorePair(r.reachedBoard||r.afterBoard),after=scorePair(r.afterBoard);return r.bommerlTo&&!r.seriesWinner&&after!==reached?`${before} → ${reached} → ${after}`:`${before} → ${reached}`}
function roundStatusForSession(id){const s=data.series.find(x=>x.sessionId===id);if(s)return{type:'win',winner:s.winner,label:'Gewonnen'};const e=data.endedSessions.find(x=>x.sessionId===id);if(e)return{type:'manual',label:'Manuell beendet'};if(data.started&&data.sessionId===id)return{type:'active',label:'Aktives Spiel'};return{type:'open',label:'Nicht beendet'}}
function recordEndedSession(reason='manual'){
 const rs=data.rounds.filter(r=>r.sessionId===data.sessionId);if(!rs.length||data.endedSessions.some(e=>e.sessionId===data.sessionId)||data.series.some(s=>s.sessionId===data.sessionId))return;
 const p=profile(),t=teamSnapshot();data.endedSessions.unshift({id:uid(),sessionId:data.sessionId,at:nowIso(),profileId:p.id,profileName:p.name,team1:[...t.team1],team2:[...t.team2],board:clone(data.board),rounds:rs.length,reason});
}
function resetSession({dealer=currentDealer(),keepStarted=true}={}){data.sessionId=uid();data.startDealerId=dealer&&data.active.includes(dealer)?dealer:(data.active[0]||null);data.board=blankBoard(data.startDealerId);data.started=keepStarted;selectedGame='__normal';selectedModifier='base';selectedNormal=profile().normalPoints[0]||1;save()}

function selectedAnnouncement(){if(selectedGame==='__normal')return{normal:true,name:'Normal',points:selectedNormal,allowedModifierIds:profile().modifiers.map(m=>m.id)};const i=Number(selectedGame);return profile().announcements[i]||{normal:true,name:'Normal',points:selectedNormal,allowedModifierIds:profile().modifiers.map(m=>m.id)}}
function modifierDef(){return profile().modifiers.find(m=>m.id===selectedModifier)||null}
function applyRounding(v,r){if(r==='ceil')return Math.ceil(v);if(r==='floor')return Math.floor(v);if(r==='round')return Math.round(v);return Math.round(v*1000)/1000}
function roundValue(){const a=selectedAnnouncement();let v=a.normal?Number(selectedNormal):Number(a.points)||0;const m=modifierDef();if(!m)return v;if(m.operation==='add')v+=Number(m.value)||0;else v*=Number(m.value)||0;return applyRounding(v,m.rounding)}
function modifierLabel(){return selectedModifier==='base'?'Normal':modifierDef()?.name||'Normal'}

function addRound(winner){
 if(Date.now()<submitLockedUntil||!data.started||!ready()||data.board.over)return;
 const pts=Number(roundValue());if(!Number.isFinite(pts)||pts<=0){alert('Die Rundenwertung muss größer als 0 sein. Prüfe das Regelprofil.');return}
 submitLockedUntil=Date.now()+420;
 const p=profile(),a=selectedAnnouncement(),teams=teamSnapshot(),before=clone(data.board),dealer=currentDealer();
 if(p.scoreMode==='down')data.board.points[winner-1]=Math.max(0,data.board.points[winner-1]-pts);else data.board.points[winner-1]=Math.min(p.limit,data.board.points[winner-1]+pts);
 const reached=clone(data.board);let bommerlTo=null,seriesWinner=null;
 if(goalReached(winner)){
  const loser=winner===1?2:1;
  if(p.bommerl>0){bommerlTo=loser;data.board.bommerl[loser-1]++;if(data.board.bommerl[loser-1]>=p.bommerl){data.board.over=true;seriesWinner=winner}else data.board.points=[initialScore(p),initialScore(p)]}
  else{data.board.over=true;seriesWinner=winner}
 }
 const next=nextDealer(dealer);data.board.dealerId=next;
 const after=clone(data.board);
 const rec={id:uid(),sessionId:data.sessionId,at:nowIso(),profileId:p.id,profileName:p.name,type:a.name,modifier:modifierLabel(),modifierId:selectedModifier,points:pts,team1:[...teams.team1],team2:[...teams.team2],winner,beforeBoard:before,reachedBoard:reached,afterBoard:after,bommerlTo,seriesWinner,dealerId:dealer};
 data.rounds.unshift(rec);
 if(seriesWinner){data.series.unshift({id:uid(),sessionId:data.sessionId,at:rec.at,profileId:p.id,profileName:p.name,team1:[...teams.team1],team2:[...teams.team2],winner,bommerl:[...data.board.bommerl]});data.ui.page='score'}
 save();renderAll();
}

function undoRound(){
 const r=data.rounds[0];if(!r||r.sessionId!==data.sessionId)return;
 if(!confirm('Letzte Runde wirklich rückgängig machen?'))return;
 data.rounds.shift();data.board=clone(r.beforeBoard||blankBoard());
 if(r.seriesWinner){const i=data.series.findIndex(s=>s.sessionId===r.sessionId);if(i>=0)data.series.splice(i,1)}
 save();renderAll();
}
function startGame(){if(!ready())return;data.started=true;data.sessionId=uid();if(!data.startDealerId||!data.active.includes(data.startDealerId))data.startDealerId=data.active[0]||null;data.board=blankBoard(data.startDealerId);selectedGame='__normal';selectedModifier='base';selectedNormal=profile().normalPoints[0]||1;save();data.ui.page='game';renderAll();window.scrollTo({top:0,behavior:'smooth'})}
function editSetup(){
 if(!data.started)return;
 const has=data.rounds.some(r=>r.sessionId===data.sessionId);if(has&&!confirm('Laufendes Spiel beenden und Setup ändern? Der Zwischenstand bleibt im Verlauf.'))return;
 if(has)recordEndedSession('setup_changed');data.started=false;data.board=blankBoard(data.startDealerId);data.ui.page='game';save();closeGameMenu();renderAll();window.scrollTo({top:0,behavior:'smooth'});
}
function newSeries(){
 if(!data.started)return;
 if(!data.board.over){const has=data.rounds.some(r=>r.sessionId===data.sessionId);if(has&&!confirm('Aktuelle Partie vorzeitig beenden und eine neue mit denselben Spielern starten?'))return;if(has)recordEndedSession('new_series')}
 const dealer=currentDealer();resetSession({dealer,keepStarted:true});closeGameMenu();renderAll();showPage('game');
}
function endGame(){
 if(!data.started)return;const has=data.rounds.some(r=>r.sessionId===data.sessionId);if(has&&!confirm('Dieses Spiel wirklich vorzeitig beenden? Der aktuelle Stand bleibt im Verlauf.'))return;if(has)recordEndedSession('manual');data.started=false;save();closeGameMenu();renderAll();showPage('game');
}

function renderProfiles(){
 const opts=data.profiles.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
 $('quickProfile').innerHTML=opts;$('quickProfile').value=data.activeProfileId;$('quickProfile').disabled=data.started;
 $('subtitle').textContent=`${profile().name} · ${profile().players} Spieler · ${profile().scoreMode==='down'?profile().limit+' runter':'bis '+profile().limit}`;
}
function renderSetup(){
 const p=profile(),players=data.players.filter(x=>!x.archived),wrap=$('activePlayers');wrap.innerHTML='';
 players.forEach(pl=>{const b=document.createElement('button');b.type='button';b.className='playerBtn'+(data.active.includes(pl.id)?' active':'');b.textContent=pl.name;b.onclick=()=>{if(data.active.includes(pl.id)){data.active=data.active.filter(x=>x!==pl.id);data.team1=data.team1.filter(x=>x!==pl.id)}else if(data.active.length<p.players)data.active.push(pl.id);data.team1=data.team1.filter(x=>data.active.includes(x));if(!data.active.includes(data.startDealerId))data.startDealerId=data.active[0]||null;data.board=blankBoard(data.startDealerId);save();renderAll()};wrap.appendChild(b)});
 $('activeHint').textContent=players.length<p.players?`Du brauchst ${p.players} aktive Spieler. Aktuell verfügbar: ${players.length}.`:`${data.active.length}/${p.players} Spieler ausgewählt`;
 const picker=$('teamPicker');picker.innerHTML='';$('teamPickLabel').textContent=`${p.teamSize} Spieler für Seite 1 auswählen`;
 data.active.forEach(id=>{const b=document.createElement('button');b.type='button';b.className='playerBtn'+(data.team1.includes(id)?' team1':'');b.textContent=pname(id);b.disabled=data.active.length!==p.players||(!data.team1.includes(id)&&data.team1.length>=p.teamSize);b.onclick=()=>{if(data.team1.includes(id))data.team1=data.team1.filter(x=>x!==id);else if(data.team1.length<p.teamSize)data.team1.push(id);data.board=blankBoard(data.startDealerId);save();renderAll()};picker.appendChild(b)});
 $('team1Names').textContent=data.team1.map(pname).join(' + ')||'—';$('team2Names').textContent=ready()?side2().map(pname).join(' + '):'—';
 renderDealerSetup();$('startGame').disabled=!ready();
}
function renderDealerSetup(){
 const order=$('dealerOrder');order.innerHTML=data.active.length?data.active.map((id,i)=>`<div class="dealerSeat"><button class="btn secondary dealerMove" data-seat="${i}" data-dir="-1" ${i===0?'disabled':''} type="button">↑</button><span>${i+1}. ${esc(pname(id))}</span><button class="btn secondary dealerMove" data-seat="${i}" data-dir="1" ${i===data.active.length-1?'disabled':''} type="button">↓</button></div>`).join(''):'<div class="small">Zuerst Spieler auswählen.</div>';
 $$('.dealerMove',order).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.seat),j=i+Number(b.dataset.dir);if(j<0||j>=data.active.length)return;[data.active[i],data.active[j]]=[data.active[j],data.active[i]];data.board=blankBoard(data.startDealerId);save();renderAll()});
 const sel=$('startDealer');sel.innerHTML=data.active.map(id=>`<option value="${esc(id)}">${esc(pname(id))}</option>`).join('');if(!data.active.includes(data.startDealerId))data.startDealerId=data.active[0]||null;if(data.startDealerId)sel.value=data.startDealerId;sel.disabled=!data.active.length;sel.onchange=()=>{data.startDealerId=sel.value;data.board=blankBoard(data.startDealerId);save();renderAll()};
 $('dealerSetupSummary').textContent=data.startDealerId?`Start: ${pname(data.startDealerId)}`:'Automatisch';
}
function renderRoundPage(){
 const active=data.started;$('gameSetup').classList.toggle('hidden',active);$('roundPage').classList.toggle('hidden',!active);if(!active)return;
 const n1=data.team1.map(pname).join(' + '),n2=side2().map(pname).join(' + ');$('compactNames').textContent=`${n1} vs ${n2}`;$('compactScore').textContent=scorePair(data.board);$('compactDealer').textContent=`🂠 ${currentDealer()?pname(currentDealer()):'—'}`;$('roundProfileLabel').textContent=profile().name;
 renderRoundControls();
}
function renderRoundControls(){
 const p=profile();if(!p.normalPoints.includes(selectedNormal))selectedNormal=p.normalPoints[0]||1;
 if(selectedGame!=='__normal'&&!p.announcements[Number(selectedGame)])selectedGame='__normal';
 const a=selectedAnnouncement(),allowed=a.normal?p.modifiers.map(m=>m.id):a.allowedModifierIds;
 if(selectedModifier!=='base'&&!allowed.includes(selectedModifier))selectedModifier='base';
 const ab=$('announcementButtons');ab.innerHTML='';
 [{value:'__normal',label:'Normal'},...p.announcements.map((x,i)=>({value:String(i),label:`${x.name} · ${fmt(x.points)}`}))].forEach(o=>{const b=document.createElement('button');b.type='button';b.className='choiceBtn'+(selectedGame===o.value?' active':'');b.textContent=o.label;b.onclick=()=>{selectedGame=o.value;selectedModifier='base';renderRoundControls()};ab.appendChild(b)});
 $('normalPointsWrap').classList.toggle('hidden',!a.normal);const np=$('normalPointsButtons');np.innerHTML='';p.normalPoints.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='choiceBtn'+(selectedNormal===n?' active':'');b.textContent=fmt(n);b.onclick=()=>{selectedNormal=n;renderRoundControls()};np.appendChild(b)});
 const mb=$('modifierButtons');mb.innerHTML='';[{id:'base',name:'Normal'},...p.modifiers.filter(m=>allowed.includes(m.id))].forEach(m=>{const b=document.createElement('button');b.type='button';b.className='choiceBtn'+(selectedModifier===m.id?' active':'');b.textContent=m.name;b.onclick=()=>{selectedModifier=m.id;renderRoundControls()};mb.appendChild(b)});
 const fixed=!a.normal&&allowed.length===0;$('fixedNote').classList.toggle('hidden',!fixed);$('roundValue').textContent=fmt(roundValue());$('win1').textContent=(data.team1.map(pname).join(' + ')||'Seite 1')+' gewinnt';$('win2').textContent=(side2().map(pname).join(' + ')||'Seite 2')+' gewinnt';$('win1').disabled=data.board.over;$('win2').disabled=data.board.over;
}
function renderScore(){
 const active=data.started;$('scoreEmpty').classList.toggle('hidden',active);$('scoreActive').classList.toggle('hidden',!active);if(!active)return;
 const p=profile(),n1=data.team1.map(pname).join(' + '),n2=side2().map(pname).join(' + ');$('activeProfileName').textContent=`${p.name} · ${p.scoreMode==='down'?p.limit+' runter':'bis '+p.limit}`;$('scoreName1').textContent=n1||'Seite 1';$('scoreName2').textContent=n2||'Seite 2';$('score1').textContent=fmt(data.board.points[0]);$('score2').textContent=fmt(data.board.points[1]);$('bomb1').textContent=bombText(data.board.bommerl[0]);$('bomb2').textContent=bombText(data.board.bommerl[1]);
 const st=$('gameStatus'),badge=$('activeStatusBadge');st.classList.toggle('win',data.board.over);badge.classList.toggle('ended',data.board.over);if(data.board.over){const s=data.series.find(x=>x.sessionId===data.sessionId),winner=s?.winner===1?n1:n2;st.textContent=winner?`🏆 ${winner} gewinnt die Partie`:'Partie beendet';badge.textContent='PARTIE BEENDET'}else{st.textContent=p.scoreMode==='down'?'Ziel: auf 0 kommen':`Ziel: ${p.limit} Punkte`;badge.textContent='AKTIVES SPIEL'}
 const d=currentDealer(),n=nextDealer(d);$('dealerName').textContent=d?pname(d):'—';$('nextDealer').textContent=n&&data.active.length>1?`Nächster: ${pname(n)}`:'Nächster: —';renderActiveHistory();
}
function renderActiveHistory(){
 const rs=data.rounds.filter(r=>r.sessionId===data.sessionId).slice().reverse();$('activeRoundCount').textContent=`${rs.length} ${rs.length===1?'Runde':'Runden'}`;const box=$('activePointHistory');if(!rs.length){box.innerHTML=`<div class="pointStep"><span class="pointScore">${scorePair(blankBoard(data.startDealerId))}</span><span class="pointDesc">Start</span><span></span></div>`;return}const shown=rs.slice(-10);box.innerHTML=(rs.length>10?`<div class="small">${rs.length-10} ältere Runden im Verlauf.</div>`:'')+shown.map(r=>`<div class="pointStep"><span class="pointScore">${esc(roundFlow(r))}</span><span class="pointDesc">${esc(r.type)} · ${esc(r.modifier||'Normal')} · ${fmt(r.points)} P.${r.bommerlTo?' · Bommerl':''}</span><span class="pointWinner">${r.winner===1?'S1':'S2'}</span></div>`).join('')}

function profileChoices(){
 const map=new Map(data.profiles.map(p=>[p.id,p.name]));
 [...data.rounds,...data.series,...data.endedSessions].forEach(x=>{if(x?.profileId&&!map.has(String(x.profileId)))map.set(String(x.profileId),String(x.profileName||'Gelöschtes Regelprofil'))});
 return [...map.entries()].map(([id,name])=>({id,name}));
}
function populateHistoryFilters(){
 const hp=$('historyProfile'),pl=$('historyPlayer'),ty=$('historyType');hp.innerHTML='<option value="all">Alle Regelprofile</option>'+profileChoices().map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if(data.ui.historyProfile!=='all'&&!profileChoices().some(p=>p.id===data.ui.historyProfile))data.ui.historyProfile='all';hp.value=data.ui.historyProfile;pl.innerHTML='<option value="all">Alle Spieler</option>'+data.players.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}${p.archived?' (archiviert)':''}</option>`).join('');pl.value=data.ui.historyPlayer;const types=[...new Set(data.rounds.map(r=>r.type))].sort((a,b)=>String(a).localeCompare(String(b),'de'));ty.innerHTML='<option value="all">Alle Ansagen</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');ty.value=data.ui.historyType;$('historySort').value=data.ui.historySort;$('historyView').value=data.ui.historyView;$('historyCurrent').checked=!!data.ui.historyCurrent;
}
function matchesProfile(x,id){if(id==='all')return true;return String(x.profileId||'')===String(id)||(!x.profileId&&data.profiles.find(p=>p.id===id)?.name===x.profileName)}
function filteredHistory(){let rs=data.rounds.filter(r=>matchesProfile(r,data.ui.historyProfile));if(data.ui.historyPlayer!=='all')rs=rs.filter(r=>r.team1.includes(data.ui.historyPlayer)||r.team2.includes(data.ui.historyPlayer));if(data.ui.historyType!=='all')rs=rs.filter(r=>r.type===data.ui.historyType);if(data.ui.historyCurrent)rs=data.started?rs.filter(r=>r.sessionId===data.sessionId):[];return rs.sort((a,b)=>(data.ui.historySort==='old'?1:-1)*(new Date(a.at)-new Date(b.at)))}
function roundCard(r,compact=false){const n1=r.team1.map(pname).join(' + '),n2=r.team2.map(pname).join(' + '),d=new Date(r.at).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});let ev='';if(r.bommerlTo)ev=`Bommerl für ${r.bommerlTo===1?n1:n2}`;if(r.seriesWinner)ev+=(ev?' · ':'')+`Partie gewonnen: ${r.seriesWinner===1?n1:n2}`;return`<div class="match"><div class="matchTop"><span class="${r.winner===1?'roundWin':''}">${esc(n1)}</span><span>vs.</span><span class="${r.winner===2?'roundWin':''}">${esc(n2)}</span></div><div class="scoreChange"><strong>${esc(roundFlow(r))}</strong></div><div class="meta">${r.dealerId?`🂠 ${esc(pname(r.dealerId))} · `:''}${esc(r.type)} · ${esc(r.modifier||'Normal')} · ${fmt(r.points)} Punkte · ${d}</div>${compact?'':`<div class="pill">${esc(r.profileName||'Regelprofil')}</div>`}${ev?`<div class="event">${esc(ev)}</div>`:''}</div>`}
function renderHistory(){
 populateHistoryFilters();$('historyFilterCard').classList.toggle('hidden',!data.ui.historyFilters);$('historyFilterToggle').textContent=data.ui.historyFilters?'Filter schließen':'Filter';const active=[];if(data.ui.historyProfile!=='all')active.push('Profil');if(data.ui.historyPlayer!=='all')active.push('Spieler');if(data.ui.historyType!=='all')active.push('Ansage');if(data.ui.historyCurrent)active.push('aktuelles Spiel');$('historyFilterState').textContent=active.length?active.join(' · '):'Alle Einträge';
 const rows=filteredHistory(),box=$('history');if(!rows.length){box.innerHTML='<div class="card emptyState"><div class="small">Keine Einträge für diese Filter.</div></div>';return}if(data.ui.historyView==='rounds'){box.innerHTML=rows.map(r=>roundCard(r)).join('');return}
 const groups=new Map();rows.forEach(r=>{const k=r.sessionId||r.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)});
 let entries=[...groups.entries()].map(([id,rs])=>({id,rs,stamp:Math.max(...rs.map(r=>+new Date(r.at)||0))}));entries.sort((a,b)=>(data.ui.historySort==='old'?1:-1)*(a.stamp-b.stamp));
 box.innerHTML=entries.map(({id,rs})=>{const sorted=rs.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)),first=sorted[0],last=sorted.at(-1),n1=first.team1.map(pname).join(' + '),n2=first.team2.map(pname).join(' + '),when=new Date(first.at).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}),status=roundStatusForSession(id);let result=status.label;if(status.type==='win')result=`Gewonnen: ${status.winner===1?n1:n2}`;const board=data.endedSessions.find(x=>x.sessionId===id)?.board||last.afterBoard;const bombs=board?.bommerl?.length===2?`${board.bommerl[0]} : ${board.bommerl[1]} Bommerl`:'';return`<details class="seriesGroup" ${id===data.sessionId&&data.started?'open':''}><summary><div><strong>${esc(n1)} vs. ${esc(n2)}</strong><span>${esc(first.profileName||'Regelprofil')} · ${when} · ${sorted.length} Runden</span></div><div class="seriesResult ${status.type==='manual'?'manual':''}">${esc(result)}${bombs?`<small>${esc(bombs)}</small>`:''}</div></summary><div class="seriesRounds">${sorted.map(r=>roundCard(r,true)).join('')}</div></details>`}).join('');
}

function periodMatch(x,period){if(!period||period==='all')return true;const t=new Date(x.at),now=new Date();if(period==='today')return t.toDateString()===now.toDateString();return now-t<=Number(period)*86400000}
function statRounds(){return data.rounds.filter(r=>matchesProfile(r,data.ui.statsProfile)&&periodMatch(r,data.ui.statsPeriod)&&(data.ui.statsScope!=='current'||(data.started&&r.sessionId===data.sessionId)))}
function statSeries(){return data.series.filter(s=>matchesProfile(s,data.ui.statsProfile)&&periodMatch(s,data.ui.statsPeriod)&&(data.ui.statsScope!=='current'||(data.started&&s.sessionId===data.sessionId)))}
function statEnded(){return data.endedSessions.filter(s=>matchesProfile(s,data.ui.statsProfile)&&periodMatch(s,data.ui.statsPeriod)&&(data.ui.statsScope!=='current'||(data.started&&s.sessionId===data.sessionId)))}
function sideOf(x,pid){if(x.team1?.includes(pid))return 1;if(x.team2?.includes(pid))return 2;return 0}
function populateStatsFilters(){const sp=$('statsProfile');sp.innerHTML='<option value="all">Alle Regelprofile</option>'+profileChoices().map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');if(data.ui.statsProfile!=='all'&&!profileChoices().some(p=>p.id===data.ui.statsProfile))data.ui.statsProfile='all';sp.value=data.ui.statsProfile;$('statsPeriod').value=data.ui.statsPeriod;$('statsSort').value=data.ui.statsSort;$('statsScope').value=data.ui.statsScope}
function renderStats(){
 populateStatsFilters();$('statsFilterCard').classList.toggle('hidden',!data.ui.statsFilters);$('statsFilterToggle').textContent=data.ui.statsFilters?'Filter schließen':'Filter';$$('[data-stats]').forEach(b=>b.classList.toggle('active',b.dataset.stats===data.ui.statsTab));$$('[data-stats-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.statsPane!==data.ui.statsTab));
 const rounds=statRounds(),series=statSeries(),ended=statEnded(),total=rounds.reduce((s,r)=>s+(Number(r.points)||0),0);$('totalRounds').textContent=rounds.length;$('totalSeries').textContent=series.length;$('totalEnded').textContent=ended.length;$('totalPoints').textContent=fmt(total);$('avgPoints').textContent=rounds.length?fmt(total/rounds.length):'0';
 const types={};rounds.forEach(r=>{const k=r.type||'Unbekannt';types[k]??={count:0,points:0};types[k].count++;types[k].points+=Number(r.points)||0});const typeEntries=Object.entries(types).sort((a,b)=>b[1].count-a[1].count);$('topGame').textContent=typeEntries[0]?.[0]||'—';$('typeStats').innerHTML=typeEntries.map(([k,v])=>`<div class="stat"><span>${esc(k)}<br><span class="small">${fmt(v.points)} Punkte gesamt</span></span><strong>${v.count}×</strong></div>`).join('')||'<div class="small">Noch keine Daten.</div>';
 const pdata=data.players.map(p=>{let rp=0,rw=0,pts=0,bm=0,bg=0,sp=0,sw=0;rounds.forEach(r=>{const side=sideOf(r,p.id);if(!side)return;rp++;if(r.winner===side){rw++;pts+=Number(r.points)||0}if(r.bommerlTo){if(r.bommerlTo===side)bg++;else bm++}});series.forEach(s=>{const side=sideOf(s,p.id);if(side){sp++;if(s.winner===side)sw++}});return{p,rp,rw,pts,bm,bg,sp,sw,rate:sp?sw/sp:0}}).filter(x=>x.rp||x.sp);
 const sort=data.ui.statsSort;pdata.sort((a,b)=>sort==='wins'?b.sw-a.sw||b.rw-a.rw:sort==='rate'?b.rate-a.rate:sort==='points'?b.pts-a.pts:b.rp-a.rp);$('playerStats').innerHTML=pdata.map(x=>`<div class="stat richStat"><span><strong>${esc(x.p.name)}</strong><br><span class="small">${x.rp} Runden · ${x.rw} Rundensiege · ${fmt(x.pts)} Punkte<br>${x.sp} Partien · ${x.sw} Partiesiege · 💣 ${x.bm} verursacht / ${x.bg} bekommen</span></span><strong>${x.sp?Math.round(x.rate*100)+'%':'—'}</strong></div>`).join('')||'<div class="small">Noch keine Daten.</div>';
 const teams={};rounds.forEach(r=>[[r.team1,1],[r.team2,2]].forEach(([arr,side])=>{const k=[...arr].sort().join('|');teams[k]??={arr,rounds:0,wins:0,pts:0,series:0,seriesWins:0};teams[k].rounds++;if(r.winner===side){teams[k].wins++;teams[k].pts+=Number(r.points)||0}}));series.forEach(s=>[[s.team1,1],[s.team2,2]].forEach(([arr,side])=>{const k=[...arr].sort().join('|');teams[k]??={arr,rounds:0,wins:0,pts:0,series:0,seriesWins:0};teams[k].series++;if(s.winner===side)teams[k].seriesWins++}));$('teamStats').innerHTML=Object.values(teams).sort((a,b)=>b.seriesWins-a.seriesWins||b.rounds-a.rounds).map(t=>`<div class="stat richStat"><span><strong>${t.arr.map(id=>esc(pname(id))).join(' + ')}</strong><br><span class="small">${t.rounds} Runden · ${t.wins} Rundensiege · ${fmt(t.pts)} Punkte<br>${t.series} Partien · ${t.seriesWins} Partiesiege</span></span><strong>${t.series?Math.round(t.seriesWins/t.series*100)+'%':'—'}</strong></div>`).join('')||'<div class="small">Noch keine Daten.</div>';
 const profs={};rounds.forEach(r=>{const key=r.profileId?`id:${r.profileId}`:`name:${r.profileName||'Unbekannt'}`;profs[key]??={id:r.profileId||null,name:r.profileName||'Unbekannt',rounds:0,points:0};profs[key].rounds++;profs[key].points+=Number(r.points)||0});$('profileStats').innerHTML=Object.values(profs).sort((a,b)=>b.rounds-a.rounds).map(v=>{const current=v.id?data.profiles.find(p=>p.id===String(v.id)):null,name=current?.name||v.name;return`<div class="stat"><span>${esc(name)}<br><span class="small">${fmt(v.points)} Punkte</span></span><strong>${v.rounds} Runden</strong></div>`}).join('')||'<div class="small">Noch keine Daten.</div>';
}

function renderPlayers(){const list=$('playerList');if(!data.players.length){list.innerHTML='<div class="small">Noch keine Spieler.</div>';return}list.innerHTML=data.players.map(p=>{const used=data.rounds.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id))||data.series.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id))||data.endedSessions.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id));return`<div class="playerManage ${p.archived?'archived':''}" data-player="${esc(p.id)}"><div class="playerIdentity"><strong>${esc(p.name)}</strong>${p.archived?'<span class="pill">Archiviert</span>':''}</div><div class="playerActions"><button class="btn secondary renamePlayer" type="button">Umbenennen</button><button class="btn secondary archivePlayer" type="button">${p.archived?'Aktivieren':'Archivieren'}</button>${!used?'<button class="btn danger deletePlayer" type="button">Löschen</button>':''}</div></div>`}).join('');$$('[data-player]',list).forEach(row=>{const p=player(row.dataset.player),used=data.rounds.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id))||data.series.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id))||data.endedSessions.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id));row.querySelector('.renamePlayer').onclick=()=>{const n=prompt('Neuer Spielername:',p.name)?.trim();if(!n||n===p.name)return;if(data.players.some(x=>x.id!==p.id&&x.name.toLowerCase()===n.toLowerCase()))return alert('Name existiert bereits.');p.name=n;save();renderAll()};row.querySelector('.archivePlayer').onclick=()=>{if(!p.archived&&data.started&&data.active.includes(p.id))return alert('Dieser Spieler ist im aktiven Spiel. Beende oder ändere zuerst das Setup.');p.archived=!p.archived;if(p.archived){data.active=data.active.filter(x=>x!==p.id);data.team1=data.team1.filter(x=>x!==p.id);if(data.startDealerId===p.id)data.startDealerId=data.active[0]||null}save();renderAll()};if(!used)row.querySelector('.deletePlayer')?.addEventListener('click',()=>{if(!confirm(`„${p.name}“ wirklich löschen?`))return;data.players=data.players.filter(x=>x.id!==p.id);data.active=data.active.filter(x=>x!==p.id);data.team1=data.team1.filter(x=>x!==p.id);save();renderAll()})})}

function loadRuleDraft(id=data.ui.ruleProfileId||data.activeProfileId){const p=data.profiles.find(x=>x.id===id)||data.profiles[0];data.ui.ruleProfileId=p.id;ruleDraft=clone(p);ruleDirty=false;renderRuleEditor()}
function markDirty(){ruleDirty=true}
function renderRuleEditor(){
 if(!ruleDraft)loadRuleDraft(data.activeProfileId);const d=ruleDraft;$('profileSelect').innerHTML=data.profiles.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');$('profileSelect').value=d.id;$('rName').value=d.name;$('rPlayers').value=d.players;$('rTeamSize').value=d.teamSize;$('rScoreMode').value=d.scoreMode;$('rLimit').value=d.limit;$('rBommerl').value=d.bommerl;$('rNormalPoints').value=d.normalPoints.join(',');$('rLimitLabel').textContent=d.scoreMode==='down'?'Startpunkte':'Punkteziel';const locked=data.started&&d.id===data.activeProfileId;$('activeRuleLock').classList.toggle('hidden',!locked);$('saveProfile').disabled=locked;
 $('modifierEditor').innerHTML=d.modifiers.length?d.modifiers.map((m,i)=>`<div class="modifierRow" data-mod="${i}"><input class="modName" maxlength="28" value="${esc(m.name)}"><select class="modOp"><option value="multiply" ${m.operation==='multiply'?'selected':''}>× Faktor</option><option value="add" ${m.operation==='add'?'selected':''}>+ Punkte</option></select><input class="modValue" type="number" min="0" step="0.1" value="${m.value}"><select class="modRound"><option value="none" ${m.rounding==='none'?'selected':''}>exakt</option><option value="ceil" ${m.rounding==='ceil'?'selected':''}>aufrunden</option><option value="floor" ${m.rounding==='floor'?'selected':''}>abrunden</option><option value="round" ${m.rounding==='round'?'selected':''}>runden</option></select><button class="btn danger modifierDelete" type="button">×</button></div>`).join(''):'<div class="small">Nur „Normal“ ist aktiv.</div>';
 $$('.modifierRow').forEach(row=>{const i=Number(row.dataset.mod);row.querySelector('.modName').oninput=e=>{d.modifiers[i].name=e.target.value;markDirty()};row.querySelector('.modOp').onchange=e=>{d.modifiers[i].operation=e.target.value;markDirty()};row.querySelector('.modValue').oninput=e=>{d.modifiers[i].value=e.target.value===''?NaN:Number(e.target.value);markDirty()};row.querySelector('.modRound').onchange=e=>{d.modifiers[i].rounding=e.target.value;markDirty()};row.querySelector('.modifierDelete').onclick=()=>{const id=d.modifiers[i].id;d.modifiers.splice(i,1);d.announcements.forEach(a=>a.allowedModifierIds=a.allowedModifierIds.filter(x=>x!==id));markDirty();renderRuleEditor()}});
 $('announcementEditor').innerHTML=d.announcements.length?d.announcements.map((a,i)=>`<div class="announceEditorRow" data-ann="${i}"><div class="announceMain"><input class="annName" maxlength="35" value="${esc(a.name)}"><input class="annPoints" type="number" min="0.1" step=".5" value="${a.points}"><button class="btn danger annDelete" type="button">×</button></div><details class="announceAllowed"><summary>Erlaubte Wertungen <span class="small">${a.allowedModifierIds.length?esc(d.modifiers.filter(m=>a.allowedModifierIds.includes(m.id)).map(m=>m.name).join(', ')):'nur Normal'}</span></summary><div class="modifierChecks">${d.modifiers.map(m=>`<label class="check"><input class="annMod" type="checkbox" value="${esc(m.id)}" ${a.allowedModifierIds.includes(m.id)?'checked':''}> ${esc(m.name)}</label>`).join('')||'<span class="small">Keine zusätzlichen Wertungen.</span>'}</div></details></div>`).join(''):'<div class="small">Keine zusätzlichen Ansagen. „Normal“ ist immer vorhanden.</div>';
 $$('.announceEditorRow').forEach(row=>{const i=Number(row.dataset.ann);row.querySelector('.annName').oninput=e=>{d.announcements[i].name=e.target.value;markDirty()};row.querySelector('.annPoints').oninput=e=>{d.announcements[i].points=e.target.value===''?NaN:Number(e.target.value);markDirty()};row.querySelector('.annDelete').onclick=()=>{d.announcements.splice(i,1);markDirty();renderRuleEditor()};$$('.annMod',row).forEach(c=>c.onchange=()=>{d.announcements[i].allowedModifierIds=$$('.annMod:checked',row).map(x=>x.value);markDirty();const summary=row.querySelector('.announceAllowed summary .small');if(summary){const names=d.modifiers.filter(m=>d.announcements[i].allowedModifierIds.includes(m.id)).map(m=>m.name);summary.textContent=names.length?names.join(', '):'nur Normal'}})});
}
function syncRuleBasics(){if(!ruleDraft)return;ruleDraft.name=$('rName').value.trim();ruleDraft.players=Math.max(2,Math.min(4,Number($('rPlayers').value)||4));ruleDraft.teamSize=Math.max(1,Math.min(ruleDraft.players-1,Number($('rTeamSize').value)||1));ruleDraft.scoreMode=$('rScoreMode').value==='up'?'up':'down';ruleDraft.limit=Math.max(1,Number($('rLimit').value)||1);ruleDraft.bommerl=Math.max(0,Number($('rBommerl').value)||0);const pts=$('rNormalPoints').value.split(',').map(x=>Number(x.trim())).filter(n=>Number.isFinite(n)&&n>0);ruleDraft.normalPoints=[...new Set(pts)]}
function validateRuleDraft(){
 if(!ruleDraft)return'Kein Regelprofil ausgewählt.';
 if(!ruleDraft.name.trim())return'Das Regelprofil braucht einen Namen.';
 if(!ruleDraft.normalPoints.length)return'Mindestens einen Wert für normales Spiel eintragen.';
 const modNames=new Set();for(const m of ruleDraft.modifiers){const name=String(m.name||'').trim().toLowerCase();if(!name)return'Jede Wertung braucht einen Namen.';if(modNames.has(name))return'Wertungsnamen dürfen nicht doppelt vorkommen.';modNames.add(name);const v=Number(m.value);if(!Number.isFinite(v))return'Jede Wertung braucht einen gültigen Zahlenwert.';if(m.operation==='multiply'&&v<=0)return'Ein Faktor muss größer als 0 sein.';if(m.operation==='add'&&v<0)return'Zusatzpunkte dürfen nicht negativ sein.'}
 const annNames=new Set();for(const a of ruleDraft.announcements){const name=String(a.name||'').trim().toLowerCase();if(!name)return'Jede Ansage braucht einen Namen.';if(annNames.has(name))return'Ansagen dürfen nicht doppelt vorkommen.';annNames.add(name);if(!Number.isFinite(Number(a.points))||Number(a.points)<=0)return'Ansage-Punkte müssen größer als 0 sein.'}
 return'';
}
function saveProfile(){if(!ruleDraft)return;syncRuleBasics();const old=data.profiles.find(p=>p.id===ruleDraft.id);if(!old)return;if(data.started&&old.id===data.activeProfileId)return alert('Das aktive Regelprofil ist während eines laufenden Spiels gesperrt.');const validation=validateRuleDraft();if(validation)return alert(validation);const changedStructure=old.players!==ruleDraft.players||old.teamSize!==ruleDraft.teamSize||old.scoreMode!==ruleDraft.scoreMode||old.limit!==ruleDraft.limit||old.bommerl!==ruleDraft.bommerl;const i=data.profiles.findIndex(p=>p.id===ruleDraft.id);data.profiles[i]=migrateProfile(clone(ruleDraft));if(ruleDraft.id===data.activeProfileId&&changedStructure){data.active=[];data.team1=[];data.startDealerId=null;data.board=blankBoard()}save();ruleDirty=false;renderAll();loadRuleDraft(ruleDraft.id);toast('Regelprofil gespeichert')}
function newProfile(){if(ruleDirty&&!confirm('Ungespeicherte Änderungen verwerfen?'))return;const p=clone(profile());p.id=uid();p.name='Neues Regelprofil';data.profiles.push(migrateProfile(p));save();loadRuleDraft(p.id);renderAll()}
function duplicateProfile(){if(!ruleDraft)return;syncRuleBasics();const p=migrateProfile(clone(ruleDraft));p.id=uid();p.name=(p.name||'Regelprofil')+' Kopie';const idMap=new Map();p.modifiers=p.modifiers.map(m=>{const oldId=m.id,newId='m_'+uid();idMap.set(oldId,newId);return{...m,id:newId}});p.announcements=p.announcements.map(a=>({...a,allowedModifierIds:a.allowedModifierIds.map(id=>idMap.get(id)).filter(Boolean)}));data.profiles.push(p);save();loadRuleDraft(p.id);renderAll()}
function deleteProfile(){if(!ruleDraft||data.profiles.length<=1)return alert('Mindestens ein Regelprofil muss bleiben.');if(data.started&&ruleDraft.id===data.activeProfileId)return alert('Das aktive Regelprofil kann während eines laufenden Spiels nicht gelöscht werden.');if(!confirm(`Profil „${ruleDraft.name}“ löschen?`))return;data.profiles=data.profiles.filter(p=>p.id!==ruleDraft.id);if(data.activeProfileId===ruleDraft.id){data.activeProfileId=data.profiles[0].id;data.active=[];data.team1=[];data.startDealerId=null;data.board=blankBoard()}save();loadRuleDraft(data.activeProfileId);renderAll()}

function downloadText(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportBackup(){downloadText(`schnapsen-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({format:'schnapsen-tracker-backup',version:10,exportedAt:nowIso(),data},null,2),'application/json')}
function importBackupFile(file){const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result),d=raw.data||raw;if(!d||!Array.isArray(d.players)||!Array.isArray(d.profiles)||!Array.isArray(d.rounds))throw Error();if(!confirm('Backup importieren und aktuelle lokale Daten ersetzen?'))return;data=normalizeData(d);save();ruleDraft=null;selectedGame='__normal';selectedModifier='base';renderAll();loadRuleDraft(data.activeProfileId);toast('Backup importiert')}catch{alert('Ungültiges Schnapsen-Backup.')}};r.readAsText(file)}
function csvCell(v){return`"${String(v??'').replaceAll('"','""')}"`}
function exportCsv(){const header=['Datum','Regelprofil','Seite 1','Seite 2','Geber','Ansage','Wertung','Punkte','Gewinner','Vorher','Erreicht','Danach','Bommerl','Partiesieg'];const rows=data.rounds.slice().reverse().map(r=>[r.at,r.profileName,r.team1.map(pname).join(' + '),r.team2.map(pname).join(' + '),r.dealerId?pname(r.dealerId):'',r.type,r.modifier,r.points,r.winner===1?r.team1.map(pname).join(' + '):r.team2.map(pname).join(' + '),scorePair(r.beforeBoard),scorePair(r.reachedBoard||r.afterBoard),scorePair(r.afterBoard),r.bommerlTo||'',r.seriesWinner||'']);downloadText(`schnapsen-verlauf-${new Date().toISOString().slice(0,10)}.csv`,'\uFEFF'+[header,...rows].map(row=>row.map(csvCell).join(';')).join('\n'),'text/csv;charset=utf-8')}
function toast(text){let t=document.createElement('div');t.textContent=text;t.style.cssText='position:fixed;left:50%;bottom:95px;transform:translateX(-50%);z-index:120;background:#17233d;color:#fff;border:1px solid rgba(110,168,255,.35);border-radius:999px;padding:8px 12px;font:700 12px system-ui;box-shadow:0 12px 30px rgba(0,0,0,.35)';document.body.appendChild(t);setTimeout(()=>t.remove(),1600)}

function showPage(page){data.ui.page=page;save();renderNavigation();window.scrollTo({top:0,behavior:'smooth'})}
function renderNavigation(){if(!['game','score','history','stats','more'].includes(data.ui.page))data.ui.page='game';const page=data.ui.page;$$('.page').forEach(p=>p.classList.add('hidden'));$('page-'+page)?.classList.remove('hidden');$$('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='more')renderMore();if(page==='stats')renderStats();if(page==='history')renderHistory();if(page==='score')renderScore()}
function renderMore(){$$('[data-more]').forEach(b=>b.classList.toggle('active',b.dataset.more===data.ui.more));$$('[data-more-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.morePane!==data.ui.more));if(data.ui.more==='rules'){if(!ruleDraft)loadRuleDraft(data.activeProfileId);renderRuleTabs()}if(data.ui.more==='players')renderPlayers()}
function renderRuleTabs(){$$('[data-rules]').forEach(b=>b.classList.toggle('active',b.dataset.rules===data.ui.rulesTab));$$('[data-rules-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.rulesPane!==data.ui.rulesTab));renderRuleEditor()}
function openGameMenu(){$('gameActions').classList.remove('hidden');document.body.classList.add('bodyNoScroll');renderGameMenu()}
function closeGameMenu(){$('gameActions').classList.add('hidden');document.body.classList.remove('bodyNoScroll')}
function renderGameMenu(){$('editGameSetup').disabled=!data.started;$('undoRound').disabled=!data.started||!data.rounds[0]||data.rounds[0].sessionId!==data.sessionId;$('newSeries').disabled=!data.started;$('endGame').disabled=!data.started||data.board.over}

function renderAll(){normalizeData(data);renderProfiles();renderSetup();renderRoundPage();renderScore();renderHistory();renderStats();renderPlayers();if(!ruleDraft)loadRuleDraft(data.ui.ruleProfileId||data.activeProfileId);else renderRuleEditor();renderNavigation();renderGameMenu()}

function bind(){
 $('quickProfile').onchange=e=>{if(data.started){e.target.value=data.activeProfileId;return}if(ruleDirty&&!confirm('Ungespeicherte Regeländerungen verwerfen?')){e.target.value=data.activeProfileId;return}data.activeProfileId=e.target.value;data.active=[];data.team1=[];data.startDealerId=null;data.board=blankBoard();selectedGame='__normal';selectedModifier='base';selectedNormal=profile().normalPoints[0]||1;save();ruleDraft=null;renderAll()};
 $('goRules').onclick=()=>{data.ui.more='rules';data.ui.rulesTab='profile';showPage('more')};$('startGame').onclick=startGame;$('compactToScore').onclick=()=>showPage('score');$('scoreToGame').onclick=()=>showPage('game');$('win1').onclick=()=>addRound(1);$('win2').onclick=()=>addRound(2);$$('.gameMenuOpen').forEach(b=>b.onclick=openGameMenu);$('closeGameMenu').onclick=closeGameMenu;$('gameActions').onclick=e=>{if(e.target===$('gameActions'))closeGameMenu()};$('editGameSetup').onclick=editSetup;$('undoRound').onclick=()=>{closeGameMenu();undoRound()};$('newSeries').onclick=newSeries;$('endGame').onclick=endGame;
 $$('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));$$('[data-more]').forEach(b=>b.onclick=()=>{data.ui.more=b.dataset.more;save();renderMore();window.scrollTo({top:0,behavior:'smooth'})});$$('[data-stats]').forEach(b=>b.onclick=()=>{data.ui.statsTab=b.dataset.stats;save();renderStats()});$$('[data-rules]').forEach(b=>b.onclick=()=>{syncRuleBasics();data.ui.rulesTab=b.dataset.rules;save();renderRuleTabs()});
 $('historyFilterToggle').onclick=()=>{data.ui.historyFilters=!data.ui.historyFilters;save();renderHistory()};['historyProfile','historyPlayer','historyType','historySort','historyView'].forEach(id=>$(id).onchange=e=>{data.ui[id]=e.target.value;save();renderHistory()});$('historyCurrent').onchange=e=>{data.ui.historyCurrent=e.target.checked;save();renderHistory()};$('clearHistoryFilters').onclick=()=>{Object.assign(data.ui,{historyProfile:'all',historyPlayer:'all',historyType:'all',historySort:'new',historyView:'games',historyCurrent:false});save();renderHistory()};
 $('statsFilterToggle').onclick=()=>{data.ui.statsFilters=!data.ui.statsFilters;save();renderStats()};['statsProfile','statsPeriod','statsSort','statsScope'].forEach(id=>$(id).onchange=e=>{data.ui[id]=e.target.value;save();renderStats()});
 $('addPlayer').onclick=()=>{const input=$('newPlayer'),n=input.value.trim();if(!n)return;if(data.players.some(p=>p.name.toLowerCase()===n.toLowerCase()))return alert('Name existiert bereits.');data.players.push({id:uid(),name:n,archived:false});input.value='';save();renderAll()};$('newPlayer').onkeydown=e=>{if(e.key==='Enter')$('addPlayer').click()};
 $('profileSelect').onchange=e=>{if(ruleDirty&&!confirm('Ungespeicherte Änderungen verwerfen?')){e.target.value=ruleDraft.id;return}loadRuleDraft(e.target.value)};['rName','rPlayers','rTeamSize','rLimit','rBommerl','rNormalPoints'].forEach(id=>$(id).oninput=()=>{syncRuleBasics();markDirty()});$('rScoreMode').onchange=()=>{syncRuleBasics();$('rLimitLabel').textContent=ruleDraft.scoreMode==='down'?'Startpunkte':'Punkteziel';markDirty()};$('saveProfile').onclick=saveProfile;$('newProfile').onclick=newProfile;$('duplicateProfile').onclick=duplicateProfile;$('deleteProfile').onclick=deleteProfile;$('addModifier').onclick=()=>{syncRuleBasics();ruleDraft.modifiers.push({id:'m_'+uid(),name:'Neue Wertung',operation:'multiply',value:2,rounding:'none'});markDirty();renderRuleEditor()};$('addAnnouncement').onclick=()=>{syncRuleBasics();ruleDraft.announcements.push({name:'Neue Ansage',points:1,allowedModifierIds:ruleDraft.modifiers.map(m=>m.id)});markDirty();renderRuleEditor()};
 $('exportBackup').onclick=exportBackup;$('importBackup').onclick=()=>$('backupFile').click();$('backupFile').onchange=e=>{const f=e.target.files?.[0];if(f)importBackupFile(f);e.target.value=''};$('exportCsv').onclick=exportCsv;$('resetAll').onclick=()=>{if(!confirm('Wirklich alle Spieler, Verläufe und eigenen Regelprofile löschen?'))return;removeSaved();data=fresh();save();ruleDraft=null;selectedGame='__normal';selectedModifier='base';renderAll();loadRuleDraft(data.activeProfileId)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGameMenu()});window.addEventListener('beforeunload',e=>{if(!ruleDirty)return;e.preventDefault();e.returnValue=''});document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
}

bind();renderAll();
})();
