const KEY="schnapsen_tracker_v3",V2="bauernschnapsen_tracker_v2",V1="bauernschnapsen_tracker_v1";
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now()+"_"+Math.random();
const preset4=()=>({id:uid(),name:"Bauernschnapsen 4er",players:4,teamSize:2,scoreMode:"down",limit:24,bommerl:2,normalPoints:[1,2,3],mods:{half:true,fleck:true,double:true,fleckFactor:2,doubleFactor:4,halfRound:"ceil"},announcements:[
{name:"Schnapser",points:6,fixed:false},{name:"Bettler",points:5,fixed:false},{name:"Bauernschnapser",points:12,fixed:false},{name:"Land",points:9,fixed:false},{name:"Jodler",points:12,fixed:false},{name:"Kontra-Schnapser",points:12,fixed:true},{name:"Kontra-Bauernschnapser",points:24,fixed:true}]});
const preset2=()=>({id:uid(),name:"Schnapsen 2er · 7",players:2,teamSize:1,scoreMode:"down",limit:7,bommerl:0,normalPoints:[1,2,3],mods:{half:false,fleck:false,double:false,fleckFactor:2,doubleFactor:4,halfRound:"ceil"},announcements:[]});
const preset3=()=>({id:uid(),name:"3 Spieler · 1 gegen 2",players:3,teamSize:1,scoreMode:"down",limit:24,bommerl:2,normalPoints:[1,2,3],mods:{half:true,fleck:true,double:true,fleckFactor:2,doubleFactor:4,halfRound:"ceil"},announcements:[
{name:"Schnapser",points:6,fixed:false},{name:"Bettler",points:5,fixed:false},{name:"Bauernschnapser",points:12,fixed:false},{name:"Land",points:9,fixed:false},{name:"Jodler",points:12,fixed:false}]});
function fresh(){
 const profiles=[preset4(),preset2(),preset3()];
 return{players:[],active:[],team1:[],rounds:[],series:[],profiles,activeProfileId:profiles[0].id,board:null,sessionId:uid(),started:false,ui:{historyProfile:"all",historyPlayer:"all",historyType:"all",historySort:"new",historyCurrent:false,statsProfile:"all",statsPeriod:"all",statsSort:"games",statsScope:"all"}};
}
function load(){
 try{
  const x=JSON.parse(localStorage.getItem(KEY));
  if(x&&Array.isArray(x.players)&&Array.isArray(x.profiles)&&x.profiles.length){
   if(!x.ui)x.ui={historyProfile:"all",historyPlayer:"all",historyType:"all",historySort:"new",historyCurrent:false,statsProfile:"all",statsPeriod:"all",statsSort:"games",statsScope:"all"};
   if(typeof x.started!=="boolean")x.started=false;
   return x;
  }
  const n=fresh(),v2=JSON.parse(localStorage.getItem(V2));
  if(v2&&Array.isArray(v2.players)){
   n.players=v2.players;n.rounds=Array.isArray(v2.rounds)?v2.rounds.map(r=>({...r,profileName:r.profileName||"Alte Regeln"})):[];
   n.series=Array.isArray(v2.series)?v2.series:[];n.active=Array.isArray(v2.active)?v2.active.slice(0,4):[];n.team1=Array.isArray(v2.team1)?v2.team1:[];
   return n;
  }
  const v1=JSON.parse(localStorage.getItem(V1));if(v1&&Array.isArray(v1.players)){n.players=v1.players;return n}
  return n;
 }catch{return fresh()}
}
let data=load(),normalPoints=1,modifier="normal",editingProfileId=data.activeProfileId;
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function player(id){return data.players.find(p=>p.id===id)} function pname(id){return player(id)?.name??"Unbekannt"}
function profile(){return data.profiles.find(p=>p.id===data.activeProfileId)||data.profiles[0]}
function editing(){return data.profiles.find(p=>p.id===editingProfileId)||data.profiles[0]}
function side2(){return data.active.filter(x=>!data.team1.includes(x))}
function ready(){const p=profile();return data.active.length===p.players&&data.team1.length===p.teamSize&&side2().length===p.players-p.teamSize}
function initialScore(p=profile()){return p.scoreMode==="down"?p.limit:0}
function blankBoard(){return{points:[initialScore(),initialScore()],bommerl:[0,0],over:false}}
function ensureBoard(){if(!data.board||!Array.isArray(data.board.points)||!Array.isArray(data.board.bommerl))data.board=blankBoard()}
ensureBoard();save();

function resetBoard(){data.board=blankBoard();data.sessionId=uid();save()}
function resetSelectionForProfile(){
 const p=profile();data.active=data.active.slice(0,p.players);data.team1=[];data.started=false;
 resetBoard();
}
function teamSnapshot(){return{team1:[...data.team1],team2:[...side2()]}}
function bombText(n){const t=profile().bommerl;if(!t)return"ohne Bommerl";return"Bommerl: "+Array.from({length:t},(_,i)=>i<n?"●":"○").join(" ")}
function goalReached(side){
 const p=profile(),v=data.board.points[side-1];
 return p.scoreMode==="down"?v<=0:v>=p.limit;
}
function selectedAnnouncement(){
 const v=document.getElementById("gameType").value;
 if(v==="__normal")return{normal:true,name:"Normal",points:normalPoints,fixed:false};
 const idx=Number(v);return profile().announcements[idx]||{normal:true,name:"Normal",points:normalPoints,fixed:false};
}
function roundValue(){
 const p=profile(),a=selectedAnnouncement();let v=a.normal?normalPoints:Number(a.points)||0;
 if(a.fixed)return v;
 if(modifier==="half"){
  v=v/2;
  if(p.mods.halfRound==="ceil")v=Math.ceil(v);else if(p.mods.halfRound==="floor")v=Math.floor(v);
 }else if(modifier==="fleck")v*=Number(p.mods.fleckFactor)||2;
 else if(modifier==="double")v*=Number(p.mods.doubleFactor)||4;
 return v;
}
function modifierLabel(){
 const p=profile();
 return modifier==="half"?"Halbiert":modifier==="fleck"?`Gefleckt ×${p.mods.fleckFactor}`:modifier==="double"?`Doppelfleck ×${p.mods.doubleFactor}`:"Normal";
}

function renderProfiles(){
 const opts=data.profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");
 const q=document.getElementById("quickProfile"),s=document.getElementById("profileSelect");
 q.innerHTML=opts;q.value=data.activeProfileId;s.innerHTML=opts;s.value=editingProfileId;
 const p=profile();document.getElementById("subtitle").textContent=`${p.name} · ${p.players} Spieler · ${p.scoreMode==="down"?p.limit+" runter":"bis "+p.limit}`;
}
function currentSessionRounds(){return data.rounds.filter(r=>r.sessionId===data.sessionId)}
function scorePair(board){return board&&Array.isArray(board.points)?`${board.points[0]} : ${board.points[1]}`:"—"}
function renderActivePointHistory(){
 const box=document.getElementById("activePointHistory");if(!box)return;
 const rounds=currentSessionRounds().slice().reverse();document.getElementById("activeRoundCount").textContent=`${rounds.length} ${rounds.length===1?"Runde":"Runden"}`;
 const p=profile(),start=`${initialScore(p)} : ${initialScore(p)}`;
 if(!rounds.length){box.innerHTML=`<div class="pointStep"><span class="pointScore">${start}</span><span class="pointDesc">Start</span><span></span></div>`;return}
 const shown=rounds.slice(-8);
 box.innerHTML=(rounds.length>8?`<div class="small" style="margin-bottom:5px">${rounds.length-8} ältere Runden findest du im Verlauf.</div>`:"")+shown.map(r=>{
  const before=scorePair(r.beforeBoard),after=scorePair(r.afterBoard),desc=`${r.type} · ${r.modifier||"Normal"} · ${r.points} P.`+(r.bommerlTo?" · Bommerl / Neustart":""),winner=r.winner===1?"S1":"S2";
  return `<div class="pointStep"><span class="pointScore">${before} → ${after}</span><span class="pointDesc">${esc(desc)}</span><span class="pointWinner">${winner}</span></div>`;
 }).join("");
}
function renderGame(){
 const p=profile(),wrap=document.getElementById("activePlayers");wrap.innerHTML="";
 document.getElementById("gameSetup").classList.toggle("hidden",!!data.started);
 document.getElementById("activeGame").classList.toggle("hidden",!data.started);
 data.players.forEach(pl=>{
  const b=document.createElement("button");b.className="player-btn"+(data.active.includes(pl.id)?" active":"");b.textContent=pl.name;
  b.onclick=()=>{
   if(data.started)return;
   if(data.active.includes(pl.id)){data.active=data.active.filter(x=>x!==pl.id);data.team1=data.team1.filter(x=>x!==pl.id)}
   else if(data.active.length<p.players)data.active.push(pl.id);
   data.team1=data.team1.filter(x=>data.active.includes(x));resetBoard();renderAll();
  };wrap.appendChild(b);
 });
 const hint=document.getElementById("activeHint");
 hint.textContent=data.players.length<p.players?`Für dieses Profil brauchst du ${p.players} Spieler. Lege noch Spieler an.`:`${data.active.length}/${p.players} Spieler ausgewählt`;
 const pick=document.getElementById("teamPicker");pick.innerHTML="";
 document.getElementById("teamPickLabel").textContent=`${p.teamSize} Spieler für Seite 1 antippen`;
 data.active.forEach(id=>{
  const b=document.createElement("button");b.className="player-btn"+(data.team1.includes(id)?" team1":"");b.textContent=pname(id);
  b.disabled=data.started||data.active.length!==p.players||(!data.team1.includes(id)&&data.team1.length>=p.teamSize);
  b.onclick=()=>{if(data.started)return;if(data.team1.includes(id))data.team1=data.team1.filter(x=>x!==id);else if(data.team1.length<p.teamSize)data.team1.push(id);resetBoard();renderAll()};pick.appendChild(b);
 });
 const s2=side2(),n1=data.team1.map(pname).join(" + "),n2=s2.map(pname).join(" + ");
 document.getElementById("team1Names").textContent=n1||"—";document.getElementById("team2Names").textContent=ready()?n2:"—";
 document.getElementById("scoreName1").textContent=n1||"Seite 1";document.getElementById("scoreName2").textContent=ready()?n2:"Seite 2";
 document.getElementById("score1").textContent=data.board.points[0];document.getElementById("score2").textContent=data.board.points[1];
 document.getElementById("bomb1").textContent=bombText(data.board.bommerl[0]);document.getElementById("bomb2").textContent=bombText(data.board.bommerl[1]);
 document.getElementById("activeProfileName").textContent=`${p.name} · ${p.scoreMode==="down"?p.limit+" runter":"bis "+p.limit}`;
 document.getElementById("startGame").disabled=!ready();
 const st=document.getElementById("gameStatus");st.classList.remove("win");
 if(!ready())st.textContent="Spieler / Seiten auswählen";
 else if(data.board.over){st.textContent="Partie beendet";st.classList.add("win")}
 else st.textContent=p.scoreMode==="down"?`Ziel: auf 0 kommen`:`Ziel: ${p.limit} Punkte`;
 renderActivePointHistory();renderRoundControls();
}
function startGame(){
 if(!ready())return;
 resetBoard();data.started=true;save();renderAll();
 requestAnimationFrame(()=>document.getElementById("activeGameCard")?.scrollIntoView({behavior:"smooth",block:"start"}));
}
function editGameSetup(){
 const has=currentSessionRounds().length>0;
 if(has&&!confirm("Laufendes Spiel beenden und Spieler/Regeln ändern? Die bisherigen Runden bleiben im Verlauf."))return;
 data.started=false;resetBoard();renderAll();window.scrollTo({top:0,behavior:"smooth"});
}
function renderRoundControls(){
 const p=profile(),gt=document.getElementById("gameType"),old=gt.value;
 gt.innerHTML='<option value="__normal">Normal</option>'+p.announcements.map((a,i)=>`<option value="${i}">${esc(a.name)} · ${a.points}</option>`).join("");
 if([...gt.options].some(o=>o.value===old))gt.value=old;
 const np=document.getElementById("normalPointsButtons");np.innerHTML="";
 if(!p.normalPoints.includes(normalPoints))normalPoints=p.normalPoints[0]??1;
 p.normalPoints.forEach(n=>{const b=document.createElement("button");b.className="mod-btn"+(normalPoints===n?" active":"");b.textContent=n;b.onclick=()=>{normalPoints=n;renderRoundControls()};np.appendChild(b)});
 const a=selectedAnnouncement();document.getElementById("normalPointsWrap").classList.toggle("hidden",!a.normal);
 const mb=document.getElementById("modifierButtons");mb.innerHTML="";
 const mods=[["normal","Normal",true],["half","Halbiert",p.mods.half],["fleck",`Gefleckt ×${p.mods.fleckFactor}`,p.mods.fleck],["double",`Doppelfleck ×${p.mods.doubleFactor}`,p.mods.double]];
 const allowed=mods.filter(x=>x[2]&&!a.fixed);
 if(a.fixed){modifier="normal";mb.innerHTML='<button class="mod-btn active" disabled>Fixe Wertung</button>'}
 else{
  if(!allowed.some(x=>x[0]===modifier))modifier="normal";
  allowed.forEach(([key,label])=>{const b=document.createElement("button");b.className="mod-btn"+(modifier===key?" active":"");b.textContent=label;b.onclick=()=>{modifier=key;renderRoundControls()};mb.appendChild(b)});
 }
 document.getElementById("fixedNote").classList.toggle("hidden",!a.fixed);
 document.getElementById("roundValue").textContent=roundValue();
 document.getElementById("win1").disabled=!data.started||!ready()||data.board.over;document.getElementById("win2").disabled=!data.started||!ready()||data.board.over;
 document.getElementById("undoRound").disabled=!data.rounds.length||data.rounds[0].sessionId!==data.sessionId;
}
