function addRound(winner){
 if(!data.started||!ready()||data.board.over)return;
 const p=profile(),a=selectedAnnouncement(),pts=roundValue(),{team1,team2}=teamSnapshot(),before=JSON.parse(JSON.stringify(data.board));
 if(p.scoreMode==="down")data.board.points[winner-1]=Math.max(0,data.board.points[winner-1]-pts);else data.board.points[winner-1]=Math.min(p.limit,data.board.points[winner-1]+pts);
 let bommerlTo=null,seriesWinner=null;
 if(goalReached(winner)){
  const loser=winner===1?2:1;
  if(p.bommerl>0){
   bommerlTo=loser;data.board.bommerl[loser-1]++;
   if(data.board.bommerl[loser-1]>=p.bommerl){data.board.over=true;seriesWinner=winner}
   else data.board.points=[initialScore(p),initialScore(p)];
  }else{data.board.over=true;seriesWinner=winner}
  if(seriesWinner)data.series.unshift({id:uid(),sessionId:data.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,team1:[...team1],team2:[...team2],winner});
 }
 data.rounds.unshift({id:uid(),sessionId:data.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,type:a.name,modifier:a.fixed?"Fix":modifierLabel(),points:pts,team1,team2,winner,beforeBoard:before,afterBoard:JSON.parse(JSON.stringify(data.board)),bommerlTo,seriesWinner});
 save();renderAll();
}
function undoRound(){
 const r=data.rounds[0];if(!r||r.sessionId!==data.sessionId)return;
 if(!confirm("Letzte Runde wirklich rückgängig machen?"))return;
 data.rounds.shift();data.board=r.beforeBoard||blankBoard();
 if(r.seriesWinner&&data.series[0]&&data.series[0].profileId===r.profileId)data.series.shift();
 save();renderAll();
}
function newSeries(){if(!data.board.over&&currentSessionRounds().length&&!confirm("Neue Partie mit denselben Spielern starten?"))return;resetBoard();data.started=true;save();renderAll()}

function populateHistoryFilters(){
 const u=data.ui,prof=document.getElementById("historyProfile"),pl=document.getElementById("historyPlayer"),ty=document.getElementById("historyType");
 prof.innerHTML='<option value="all">Alle Regelprofile</option>'+data.profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");prof.value=u.historyProfile||"all";
 pl.innerHTML='<option value="all">Alle Spieler</option>'+data.players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");pl.value=u.historyPlayer||"all";
 const types=[...new Set(data.rounds.map(r=>r.type))].sort((a,b)=>a.localeCompare(b,"de"));ty.innerHTML='<option value="all">Alle Ansagen</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("");ty.value=u.historyType||"all";
 document.getElementById("historySort").value=u.historySort||"new";document.getElementById("historyCurrent").checked=!!u.historyCurrent;
}
function roundMatchesProfile(r,id){if(id==="all")return true;return r.profileId===id||(!r.profileId&&data.profiles.find(p=>p.id===id)?.name===r.profileName)}
function renderHistory(){
 populateHistoryFilters();const u=data.ui,box=document.getElementById("history");
 let rows=data.rounds.filter(r=>roundMatchesProfile(r,u.historyProfile||"all"));
 if(u.historyPlayer&&u.historyPlayer!=="all")rows=rows.filter(r=>r.team1.includes(u.historyPlayer)||r.team2.includes(u.historyPlayer));
 if(u.historyType&&u.historyType!=="all")rows=rows.filter(r=>r.type===u.historyType);
 if(u.historyCurrent)rows=rows.filter(r=>r.sessionId===data.sessionId);
 rows=rows.slice().sort((a,b)=>(u.historySort==="old"?1:-1)*(new Date(a.at)-new Date(b.at)));
 if(!rows.length){box.innerHTML='<div class="empty">Keine Runden für diese Filter.</div>';return}
 box.innerHTML=rows.map(r=>{
  const n1=r.team1.map(pname).join(" + "),n2=r.team2.map(pname).join(" + "),d=new Date(r.at).toLocaleString("de-AT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
  let ev=r.bommerlTo?`Bommerl für Seite ${r.bommerlTo}`:"";if(r.seriesWinner)ev+=(ev?" · ":"")+`Partie gewonnen von Seite ${r.seriesWinner}`;
  const before=scorePair(r.beforeBoard),after=scorePair(r.afterBoard),resetNote=r.bommerlTo&&!r.seriesWinner?" · neuer Durchgang":"";
  return`<div class="match"><div class="matchTop"><span class="${r.winner===1?"roundWin":""}">${esc(n1)}</span><span>vs.</span><span class="${r.winner===2?"roundWin":""}">${esc(n2)}</span></div><div class="scoreChange"><strong>${before} → ${after}</strong>${resetNote}</div><div class="meta">${esc(r.type)} · ${esc(r.modifier||"Normal")} · ${r.points} Punkte · ${d}</div><div class="pill">${esc(r.profileName||"Regelprofil")}</div>${ev?`<div class="event">${esc(ev)}</div>`:""}</div>`;
 }).join("");
}
function renderPlayers(){
 const list=document.getElementById("playerList");if(!data.players.length){list.innerHTML='<div class="empty">Noch keine Spieler.</div>';return}list.innerHTML="";
 data.players.forEach(p=>{const row=document.createElement("div");row.className="playerRow";const s=document.createElement("span");s.textContent=p.name;const b=document.createElement("button");b.className="btn secondary";b.style.width="auto";b.textContent="Löschen";b.onclick=()=>{
  if(data.rounds.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id))){alert("Dieser Spieler kommt im Verlauf vor und kann nicht gelöscht werden.");return}
  data.players=data.players.filter(x=>x.id!==p.id);data.active=data.active.filter(x=>x!==p.id);data.team1=data.team1.filter(x=>x!==p.id);save();renderAll()
 };row.append(s,b);list.appendChild(row)})
}
function populateStatsFilters(){
 const u=data.ui,sp=document.getElementById("statsProfile");sp.innerHTML='<option value="all">Alle Regelprofile</option>'+data.profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");sp.value=u.statsProfile||"all";
 document.getElementById("statsPeriod").value=u.statsPeriod||"all";document.getElementById("statsSort").value=u.statsSort||"games";document.getElementById("statsScope").value=u.statsScope||"all";
}
function periodMatch(r,period){if(!period||period==="all")return true;const t=new Date(r.at),now=new Date();if(period==="today")return t.toDateString()===now.toDateString();const days=Number(period)||0;return now-t<=days*86400000}
function statRounds(){const u=data.ui;let rs=data.rounds.filter(r=>roundMatchesProfile(r,u.statsProfile||"all")&&periodMatch(r,u.statsPeriod||"all"));if(u.statsScope==="current")rs=rs.filter(r=>r.sessionId===data.sessionId);return rs}
function renderStats(){
 populateStatsFilters();const rounds=statRounds(),u=data.ui;
 document.getElementById("totalRounds").textContent=rounds.length;
 const sessionIds=new Set(rounds.map(r=>r.sessionId).filter(Boolean)),series=data.series.filter(s=>{if(u.statsScope==="current"&&s.sessionId!==data.sessionId)return false;if(u.statsProfile&&u.statsProfile!=="all"&&!roundMatchesProfile(s,u.statsProfile))return false;return periodMatch(s,u.statsPeriod||"all")&&(sessionIds.size===0||!s.sessionId||sessionIds.has(s.sessionId))});
 document.getElementById("totalSeries").textContent=series.length;
 const totalPts=rounds.reduce((a,r)=>a+(Number(r.points)||0),0);document.getElementById("totalPoints").textContent=totalPts;document.getElementById("avgPoints").textContent=rounds.length?Math.round(totalPts/rounds.length*10)/10:0;
 const types={};rounds.forEach(r=>{if(!types[r.type])types[r.type]={count:0,points:0};types[r.type].count++;types[r.type].points+=Number(r.points)||0});const te=Object.entries(types).sort((a,b)=>b[1].count-a[1].count);document.getElementById("topGame").textContent=te[0]?.[0]??"—";
 const pdata=data.players.map(p=>{let games=0,wins=0,points=0;rounds.forEach(r=>{const a=r.team1.includes(p.id),b=r.team2.includes(p.id);if(a||b){games++;if((a&&r.winner===1)||(b&&r.winner===2)){wins++;points+=Number(r.points)||0}}});return{p,games,wins,points,rate:games?wins/games:0}}).filter(x=>x.games);
 const sort=u.statsSort||"games";pdata.sort((a,b)=>sort==="wins"?b.wins-a.wins:sort==="rate"?b.rate-a.rate:sort==="points"?b.points-a.points:b.games-a.games);
 document.getElementById("playerStats").innerHTML=pdata.map(x=>`<div class="stat"><span><strong>${esc(x.p.name)}</strong><br><span class="small">${x.games} Runden · ${x.wins} Siege · ${x.points} gewonnene Punkte</span></span><strong>${Math.round(x.rate*100)}%</strong></div>`).join("")||'<div class="empty">Noch keine Statistik.</div>';
 const teams={};rounds.forEach(r=>[[r.team1,1],[r.team2,2]].forEach(([arr,side])=>{const k=[...arr].sort().join("|");if(!teams[k])teams[k]={arr,g:0,w:0,points:0};teams[k].g++;if(r.winner===side){teams[k].w++;teams[k].points+=Number(r.points)||0}}));
 document.getElementById("teamStats").innerHTML=Object.values(teams).sort((a,b)=>b.g-a.g).map(t=>`<div class="stat"><span><strong>${t.arr.map(x=>esc(pname(x))).join(" + ")}</strong><br><span class="small">${t.g} Runden · ${t.w} Siege · ${t.points} Punkte</span></span><strong>${Math.round(t.w/t.g*100)}%</strong></div>`).join("")||'<div class="empty">Noch keine Statistik.</div>';
 document.getElementById("typeStats").innerHTML=te.map(([k,v])=>`<div class="stat"><span>${esc(k)}<br><span class="small">${v.points} Punkte gesamt</span></span><strong>${v.count}×</strong></div>`).join("")||'<div class="empty">Noch keine Ansagen.</div>';
 const prof={};rounds.forEach(r=>{const k=r.profileName||"Unbekannt";if(!prof[k])prof[k]={r:0,p:0};prof[k].r++;prof[k].p+=Number(r.points)||0});document.getElementById("profileStats").innerHTML=Object.entries(prof).sort((a,b)=>b[1].r-a[1].r).map(([k,v])=>`<div class="stat"><span>${esc(k)}<br><span class="small">${v.p} Punkte</span></span><strong>${v.r} Runden</strong></div>`).join("")||'<div class="empty">Noch keine Daten.</div>';
}

function loadRuleEditor(){
 const p=editing();if(!p)return;
 document.getElementById("rName").value=p.name;document.getElementById("rPlayers").value=p.players;document.getElementById("rTeamSize").value=p.teamSize;document.getElementById("rScoreMode").value=p.scoreMode;document.getElementById("rLimit").value=p.limit;document.getElementById("rBommerl").value=p.bommerl;document.getElementById("rNormalPoints").value=p.normalPoints.join(",");
 document.getElementById("rHalf").checked=!!p.mods.half;document.getElementById("rFleck").checked=!!p.mods.fleck;document.getElementById("rDouble").checked=!!p.mods.double;document.getElementById("rFleckFactor").value=p.mods.fleckFactor;document.getElementById("rDoubleFactor").value=p.mods.doubleFactor;document.getElementById("rHalfRound").value=p.mods.halfRound||"ceil";
 document.getElementById("rLimitLabel").textContent=p.scoreMode==="down"?"Startpunkte":"Punkteziel";
 renderAnnouncementEditor(p.announcements);
}
function renderAnnouncementEditor(arr){
 const box=document.getElementById("announcementEditor");box.innerHTML="";
 if(!arr.length)box.innerHTML='<div class="empty">Keine zusätzlichen Ansagen. „Normal“ ist immer vorhanden.</div>';
 arr.forEach((a,i)=>{
  const r=document.createElement("div");r.className="announce";
  r.innerHTML=`<input class="miniInput ann-name" data-i="${i}" maxlength="35" value="${esc(a.name)}"><input class="miniInput ann-points" data-i="${i}" type="number" min="0" step=".5" value="${a.points}"><label class="check lock"><input class="ann-fixed" data-i="${i}" type="checkbox" ${a.fixed?"checked":""}> Fix</label><button class="btn danger ann-del" data-i="${i}">×</button>`;box.appendChild(r)
 });
}
function readEditorInto(p){
 const name=document.getElementById("rName").value.trim();if(!name){alert("Profil braucht einen Namen.");return false}
 const players=Math.max(2,Math.min(4,Number(document.getElementById("rPlayers").value)||4)),teamSize=Math.max(1,Math.min(players-1,Number(document.getElementById("rTeamSize").value)||1));
 const normalPoints=document.getElementById("rNormalPoints").value.split(",").map(x=>Number(x.trim())).filter(x=>Number.isFinite(x)&&x>0);
 if(!normalPoints.length){alert("Mindestens einen Wert für normales Spiel eintragen.");return false}
 const anns=[...document.querySelectorAll(".ann-name")].map((el,i)=>({name:el.value.trim(),points:Number(document.querySelectorAll(".ann-points")[i].value),fixed:document.querySelectorAll(".ann-fixed")[i].checked})).filter(a=>a.name&&Number.isFinite(a.points)&&a.points>=0);
 Object.assign(p,{name,players,teamSize,scoreMode:document.getElementById("rScoreMode").value,limit:Math.max(1,Number(document.getElementById("rLimit").value)||1),bommerl:Math.max(0,Number(document.getElementById("rBommerl").value)||0),normalPoints:[...new Set(normalPoints)],mods:{half:document.getElementById("rHalf").checked,fleck:document.getElementById("rFleck").checked,double:document.getElementById("rDouble").checked,fleckFactor:Math.max(1,Number(document.getElementById("rFleckFactor").value)||2),doubleFactor:Math.max(1,Number(document.getElementById("rDoubleFactor").value)||4),halfRound:document.getElementById("rHalfRound").value},announcements:anns});
 return true;
}
function saveProfile(){
 const p=editing();if(!readEditorInto(p))return;
 const active=p.id===data.activeProfileId;if(active){data.active=data.active.slice(0,p.players);data.team1=[];data.started=false;resetBoard()}else save();
 alert("Regelprofil gespeichert.");renderAll();loadRuleEditor();
}
function newProfile(){
 const base=JSON.parse(JSON.stringify(profile()));base.id=uid();base.name="Neues Regelprofil";data.profiles.push(base);editingProfileId=base.id;save();renderProfiles();loadRuleEditor();
}
function duplicateProfile(){
 const src=editing(),p=JSON.parse(JSON.stringify(src));p.id=uid();p.name=src.name+" Kopie";data.profiles.push(p);editingProfileId=p.id;save();renderProfiles();loadRuleEditor();
}
function deleteProfile(){
 if(data.profiles.length<=1){alert("Mindestens ein Regelprofil muss bleiben.");return}
 const p=editing();if(!confirm(`Profil „${p.name}“ löschen?`))return;
 data.profiles=data.profiles.filter(x=>x.id!==p.id);if(data.activeProfileId===p.id){data.activeProfileId=data.profiles[0].id;resetSelectionForProfile()}editingProfileId=data.profiles[0].id;save();renderAll();loadRuleEditor();
}

function renderAll(){ensureBoard();renderProfiles();renderGame();renderHistory();renderPlayers();renderStats()}
document.getElementById("quickProfile").onchange=e=>{if(e.target.value===data.activeProfileId)return;data.activeProfileId=e.target.value;editingProfileId=e.target.value;resetSelectionForProfile();normalPoints=profile().normalPoints[0]??1;modifier="normal";save();renderAll();loadRuleEditor()};
document.getElementById("profileSelect").onchange=e=>{editingProfileId=e.target.value;loadRuleEditor()};
document.getElementById("goRules").onclick=()=>document.querySelector('.tab[data-page="rules"]').click();
document.getElementById("gameType").onchange=()=>{modifier="normal";renderRoundControls()};
document.getElementById("startGame").onclick=startGame;document.getElementById("editGameSetup").onclick=editGameSetup;
document.getElementById("win1").onclick=()=>addRound(1);document.getElementById("win2").onclick=()=>addRound(2);document.getElementById("newSeries").onclick=newSeries;document.getElementById("undoRound").onclick=undoRound;
document.getElementById("addPlayer").onclick=()=>{const i=document.getElementById("newPlayer"),n=i.value.trim();if(!n)return;if(data.players.some(p=>p.name.toLowerCase()===n.toLowerCase())){alert("Name existiert bereits.");return}data.players.push({id:uid(),name:n});i.value="";save();renderAll()};
document.getElementById("newPlayer").onkeydown=e=>{if(e.key==="Enter")document.getElementById("addPlayer").click()};
document.getElementById("resetAll").onclick=()=>{if(confirm("Wirklich alle Spieler, Verläufe und eigenen Regelprofile löschen?")){localStorage.removeItem(KEY);data=fresh();editingProfileId=data.activeProfileId;ensureBoard();save();renderAll();loadRuleEditor()}};
document.getElementById("saveProfile").onclick=saveProfile;document.getElementById("newProfile").onclick=newProfile;document.getElementById("duplicateProfile").onclick=duplicateProfile;document.getElementById("deleteProfile").onclick=deleteProfile;
document.getElementById("rScoreMode").onchange=e=>document.getElementById("rLimitLabel").textContent=e.target.value==="down"?"Startpunkte":"Punkteziel";
document.getElementById("addAnnouncement").onclick=()=>{const p=editing();readEditorInto(p);p.announcements.push({name:"Neue Ansage",points:1,fixed:false});renderAnnouncementEditor(p.announcements)};
document.getElementById("announcementEditor").onclick=e=>{const b=e.target.closest(".ann-del");if(!b)return;const p=editing();readEditorInto(p);p.announcements.splice(Number(b.dataset.i),1);renderAnnouncementEditor(p.announcements)};

["historyProfile","historyPlayer","historyType","historySort"].forEach(id=>document.getElementById(id).onchange=e=>{const key={historyProfile:"historyProfile",historyPlayer:"historyPlayer",historyType:"historyType",historySort:"historySort"}[id];data.ui[key]=e.target.value;save();renderHistory()});
document.getElementById("historyCurrent").onchange=e=>{data.ui.historyCurrent=e.target.checked;save();renderHistory()};
document.getElementById("clearHistoryFilters").onclick=()=>{Object.assign(data.ui,{historyProfile:"all",historyPlayer:"all",historyType:"all",historySort:"new",historyCurrent:false});save();renderHistory()};
["statsProfile","statsPeriod","statsSort","statsScope"].forEach(id=>document.getElementById(id).onchange=e=>{const key={statsProfile:"statsProfile",statsPeriod:"statsPeriod",statsSort:"statsSort",statsScope:"statsScope"}[id];data.ui[key]=e.target.value;save();renderStats()});
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{
document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===t));["game","history","stats","players","rules"].forEach(p=>document.getElementById("page-"+p).classList.toggle("hidden",p!==t.dataset.page));if(t.dataset.page==="rules"){editingProfileId=data.activeProfileId;renderProfiles();loadRuleEditor()}renderAll()});
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
renderAll();loadRuleEditor();
