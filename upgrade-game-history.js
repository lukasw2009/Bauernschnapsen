function clone(x){return JSON.parse(JSON.stringify(x))}
function roundScoreFlow(r){
 const before=scorePair(r.beforeBoard),reached=scorePair(r.reachedBoard||r.afterBoard),after=scorePair(r.afterBoard);
 return r.bommerlTo&&!r.seriesWinner?`${before} → ${reached} → ${after}`:`${before} → ${reached}`;
}
function addRound(winner){
 if(roundSubmitting||!data.started||!ready()||data.board.over)return;
 roundSubmitting=true;
 const p=profile(),a=selectedAnnouncement(),pts=roundValue(),{team1,team2}=teamSnapshot(),before=clone(data.board);
 if(p.scoreMode==="down")data.board.points[winner-1]=Math.max(0,data.board.points[winner-1]-pts);else data.board.points[winner-1]=Math.min(p.limit,data.board.points[winner-1]+pts);
 const reached=clone(data.board);
 let bommerlTo=null,seriesWinner=null;
 if(goalReached(winner)){
  const loser=winner===1?2:1;
  if(p.bommerl>0){
   bommerlTo=loser;data.board.bommerl[loser-1]++;
   if(data.board.bommerl[loser-1]>=p.bommerl){data.board.over=true;seriesWinner=winner}
   else data.board.points=[initialScore(p),initialScore(p)];
  }else{data.board.over=true;seriesWinner=winner}
  if(seriesWinner)data.series.unshift({id:uid(),sessionId:data.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,team1:[...team1],team2:[...team2],winner,bommerl:[...data.board.bommerl]});
 }
 data.rounds.unshift({id:uid(),sessionId:data.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,type:a.name,modifier:a.fixed?"Fix":modifierLabel(),points:pts,team1,team2,winner,beforeBoard:before,reachedBoard:reached,afterBoard:clone(data.board),bommerlTo,seriesWinner});
 save();renderAll();
 setTimeout(()=>{roundSubmitting=false},450);
}
function undoRound(){
 const r=data.rounds[0];if(!r||r.sessionId!==data.sessionId)return;
 if(!confirm("Letzte Runde wirklich rückgängig machen?"))return;
 data.rounds.shift();data.board=r.beforeBoard||blankBoard();
 if(r.seriesWinner){const i=data.series.findIndex(s=>s.sessionId===r.sessionId);if(i>=0)data.series.splice(i,1)}
 save();renderAll();
}
function newSeries(){if(!data.board.over&&currentSessionRounds().length&&!confirm("Neue Partie mit denselben Spielern starten?"))return;resetBoard();data.started=true;save();renderAll()}

function populateHistoryFilters(){
 const u=data.ui,prof=document.getElementById("historyProfile"),pl=document.getElementById("historyPlayer"),ty=document.getElementById("historyType");
 prof.innerHTML='<option value="all">Alle Regelprofile</option>'+data.profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");prof.value=u.historyProfile||"all";
 pl.innerHTML='<option value="all">Alle Spieler</option>'+data.players.map(p=>`<option value="${p.id}">${esc(p.name)}${p.archived?" (archiviert)":""}</option>`).join("");pl.value=u.historyPlayer||"all";
 const types=[...new Set(data.rounds.map(r=>r.type))].sort((a,b)=>a.localeCompare(b,"de"));ty.innerHTML='<option value="all">Alle Ansagen</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join("");ty.value=u.historyType||"all";
 document.getElementById("historySort").value=u.historySort||"new";document.getElementById("historyCurrent").checked=!!u.historyCurrent;document.getElementById("historyView").value=u.historyView||"games";
}
function roundMatchesProfile(r,id){if(id==="all")return true;return r.profileId===id||(!r.profileId&&data.profiles.find(p=>p.id===id)?.name===r.profileName)}
function filteredHistoryRounds(){
 const u=data.ui;let rows=data.rounds.filter(r=>roundMatchesProfile(r,u.historyProfile||"all"));
 if(u.historyPlayer&&u.historyPlayer!=="all")rows=rows.filter(r=>r.team1.includes(u.historyPlayer)||r.team2.includes(u.historyPlayer));
 if(u.historyType&&u.historyType!=="all")rows=rows.filter(r=>r.type===u.historyType);
 if(u.historyCurrent)rows=rows.filter(r=>r.sessionId===data.sessionId);
 return rows.slice().sort((a,b)=>(u.historySort==="old"?1:-1)*(new Date(a.at)-new Date(b.at)));
}
function roundCard(r,compact=false){
 const n1=r.team1.map(pname).join(" + "),n2=r.team2.map(pname).join(" + "),d=new Date(r.at).toLocaleString("de-AT",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
 let ev=r.bommerlTo?`Bommerl für ${r.bommerlTo===1?n1:n2}`:"";if(r.seriesWinner)ev+=(ev?" · ":"")+`Partie gewonnen: ${r.seriesWinner===1?n1:n2}`;
 return`<div class="match ${compact?"compactMatch":""}"><div class="matchTop"><span class="${r.winner===1?"roundWin":""}">${esc(n1)}</span><span>vs.</span><span class="${r.winner===2?"roundWin":""}">${esc(n2)}</span></div><div class="scoreChange"><strong>${roundScoreFlow(r)}</strong>${r.bommerlTo&&!r.seriesWinner?' · neuer Durchgang':''}</div><div class="meta">${esc(r.type)} · ${esc(r.modifier||"Normal")} · ${r.points} Punkte · ${d}</div>${compact?"":`<div class="pill">${esc(r.profileName||"Regelprofil")}</div>`}${ev?`<div class="event">${esc(ev)}</div>`:""}</div>`;
}
function renderGroupedHistory(rows,box){
 const groups=new Map();rows.forEach(r=>{const k=r.sessionId||r.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)});
 const entries=[...groups.entries()];
 box.innerHTML=entries.map(([session,rs])=>{
  const sorted=rs.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)),first=sorted[0],last=sorted[sorted.length-1],series=data.series.find(s=>s.sessionId===session);
  const n1=first.team1.map(pname).join(" + "),n2=first.team2.map(pname).join(" + ");
  const when=new Date(first.at).toLocaleString("de-AT",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});
  const winner=series?(series.winner===1?n1:n2):null;
  const result=winner?`Gewonnen: ${winner}`:(session===data.sessionId&&data.started?"Aktives Spiel":"Nicht beendet");
  const bombs=last.afterBoard?.bommerl?.length===2?`${last.afterBoard.bommerl[0]} : ${last.afterBoard.bommerl[1]} Bommerl`:"";
  return `<details class="seriesGroup" ${session===data.sessionId&&data.started?'open':''}><summary><div><strong>${esc(n1)} <span class="mutedVs">vs.</span> ${esc(n2)}</strong><span>${esc(first.profileName||"Regelprofil")} · ${when}</span></div><div class="seriesResult">${esc(result)}${bombs?`<small>${esc(bombs)}</small>`:""}</div></summary><div class="seriesRounds">${sorted.map(r=>roundCard(r,true)).join("")}</div></details>`;
 }).join("");
}
function renderHistory(){
 populateHistoryFilters();const rows=filteredHistoryRounds(),box=document.getElementById("history");
 if(!rows.length){box.innerHTML='<div class="empty">Keine Runden für diese Filter.</div>';return}
 if((data.ui.historyView||"games")==="games")renderGroupedHistory(rows,box);else box.innerHTML=rows.map(r=>roundCard(r)).join("");
}
