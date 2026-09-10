function renderPlayers(){
 const list=document.getElementById("playerList");if(!data.players.length){list.innerHTML='<div class="empty">Noch keine Spieler.</div>';return}list.innerHTML="";
 data.players.forEach(p=>{
  const used=data.rounds.some(r=>r.team1.includes(p.id)||r.team2.includes(p.id));
  const row=document.createElement("div");row.className="playerManage"+(p.archived?" archived":"");
  row.innerHTML=`<div class="playerIdentity"><strong>${esc(p.name)}</strong>${p.archived?'<span class="pill">Archiviert</span>':''}</div><div class="playerActions"><button class="btn secondary renamePlayer">Umbenennen</button><button class="btn secondary archivePlayer">${p.archived?'Aktivieren':'Archivieren'}</button>${!used?'<button class="btn danger deletePlayer">Löschen</button>':''}</div>`;
  row.querySelector(".renamePlayer").onclick=()=>{const n=prompt("Neuer Spielername:",p.name)?.trim();if(!n||n===p.name)return;if(data.players.some(x=>x.id!==p.id&&x.name.toLowerCase()===n.toLowerCase())){alert("Name existiert bereits.");return}p.name=n;save();renderAll()};
  row.querySelector(".archivePlayer").onclick=()=>{if(!p.archived&&data.active.includes(p.id)){alert("Dieser Spieler ist aktuell ausgewählt. Ändere zuerst das Spiel-Setup.");return}p.archived=!p.archived;save();renderAll()};
  row.querySelector(".deletePlayer")?.addEventListener("click",()=>{if(!confirm(`„${p.name}“ wirklich löschen?`))return;data.players=data.players.filter(x=>x.id!==p.id);data.active=data.active.filter(x=>x!==p.id);data.team1=data.team1.filter(x=>x!==p.id);save();renderAll()});
  list.appendChild(row);
 });
}
function populateStatsFilters(){
 const u=data.ui,sp=document.getElementById("statsProfile");sp.innerHTML='<option value="all">Alle Regelprofile</option>'+data.profiles.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");sp.value=u.statsProfile||"all";
 document.getElementById("statsPeriod").value=u.statsPeriod||"all";document.getElementById("statsSort").value=u.statsSort||"games";document.getElementById("statsScope").value=u.statsScope||"all";
}
function periodMatch(r,period){if(!period||period==="all")return true;const t=new Date(r.at),now=new Date();if(period==="today")return t.toDateString()===now.toDateString();const days=Number(period)||0;return now-t<=days*86400000}
function statRounds(){const u=data.ui;let rs=data.rounds.filter(r=>roundMatchesProfile(r,u.statsProfile||"all")&&periodMatch(r,u.statsPeriod||"all"));if(u.statsScope==="current")rs=rs.filter(r=>r.sessionId===data.sessionId);return rs}
function statSeries(){const u=data.ui;return data.series.filter(s=>roundMatchesProfile(s,u.statsProfile||"all")&&periodMatch(s,u.statsPeriod||"all")&&(u.statsScope!=="current"||s.sessionId===data.sessionId))}
function sideOf(r,pid){if(r.team1.includes(pid))return 1;if(r.team2.includes(pid))return 2;return 0}
function renderStats(){
 populateStatsFilters();const rounds=statRounds(),series=statSeries(),u=data.ui;
 document.getElementById("totalRounds").textContent=rounds.length;document.getElementById("totalSeries").textContent=series.length;
 const totalPts=rounds.reduce((a,r)=>a+(Number(r.points)||0),0);document.getElementById("totalPoints").textContent=totalPts;document.getElementById("avgPoints").textContent=rounds.length?Math.round(totalPts/rounds.length*10)/10:0;
 const types={};rounds.forEach(r=>{if(!types[r.type])types[r.type]={count:0,points:0};types[r.type].count++;types[r.type].points+=Number(r.points)||0});const te=Object.entries(types).sort((a,b)=>b[1].count-a[1].count);document.getElementById("topGame").textContent=te[0]?.[0]??"—";
 const pdata=data.players.map(p=>{
  let roundsPlayed=0,roundWins=0,points=0,bommerlMade=0,bommerlGot=0,seriesPlayed=0,seriesWins=0;
  rounds.forEach(r=>{const side=sideOf(r,p.id);if(!side)return;roundsPlayed++;if(r.winner===side){roundWins++;points+=Number(r.points)||0}if(r.bommerlTo){if(r.bommerlTo===side)bommerlGot++;else bommerlMade++}});
  series.forEach(s=>{const side=sideOf(s,p.id);if(!side)return;seriesPlayed++;if(s.winner===side)seriesWins++});
  return{p,roundsPlayed,roundWins,points,bommerlMade,bommerlGot,seriesPlayed,seriesWins,seriesRate:seriesPlayed?seriesWins/seriesPlayed:0,roundRate:roundsPlayed?roundWins/roundsPlayed:0};
 }).filter(x=>x.roundsPlayed||x.seriesPlayed);
 const sort=u.statsSort||"games";pdata.sort((a,b)=>sort==="wins"?b.seriesWins-a.seriesWins||b.roundWins-a.roundWins:sort==="rate"?b.seriesRate-a.seriesRate:sort==="points"?b.points-a.points:b.roundsPlayed-a.roundsPlayed);
 document.getElementById("playerStats").innerHTML=pdata.map(x=>`<div class="stat richStat"><span><strong>${esc(x.p.name)}</strong><br><span class="small">${x.roundsPlayed} Runden · ${x.roundWins} Rundensiege · ${x.points} Punkte<br>${x.seriesPlayed} Partien · ${x.seriesWins} Partiesiege · 💣 ${x.bommerlMade} verursacht / ${x.bommerlGot} bekommen</span></span><strong>${x.seriesPlayed?Math.round(x.seriesRate*100)+'%':'—'}</strong></div>`).join("")||'<div class="empty">Noch keine Statistik.</div>';
 const teams={};
 rounds.forEach(r=>[[r.team1,1],[r.team2,2]].forEach(([arr,side])=>{const k=[...arr].sort().join("|");if(!teams[k])teams[k]={arr,rounds:0,roundWins:0,points:0,series:0,seriesWins:0};teams[k].rounds++;if(r.winner===side){teams[k].roundWins++;teams[k].points+=Number(r.points)||0}}));
 series.forEach(s=>[[s.team1,1],[s.team2,2]].forEach(([arr,side])=>{const k=[...arr].sort().join("|");if(!teams[k])teams[k]={arr,rounds:0,roundWins:0,points:0,series:0,seriesWins:0};teams[k].series++;if(s.winner===side)teams[k].seriesWins++}));
 document.getElementById("teamStats").innerHTML=Object.values(teams).sort((a,b)=>b.seriesWins-a.seriesWins||b.rounds-a.rounds).map(t=>`<div class="stat richStat"><span><strong>${t.arr.map(x=>esc(pname(x))).join(" + ")}</strong><br><span class="small">${t.rounds} Runden · ${t.roundWins} Rundensiege · ${t.points} Punkte<br>${t.series} Partien · ${t.seriesWins} Partiesiege</span></span><strong>${t.series?Math.round(t.seriesWins/t.series*100)+'%':'—'}</strong></div>`).join("")||'<div class="empty">Noch keine Statistik.</div>';
 document.getElementById("typeStats").innerHTML=te.map(([k,v])=>`<div class="stat"><span>${esc(k)}<br><span class="small">${v.points} Punkte gesamt</span></span><strong>${v.count}×</strong></div>`).join("")||'<div class="empty">Noch keine Ansagen.</div>';
 const prof={};rounds.forEach(r=>{const k=r.profileName||"Unbekannt";if(!prof[k])prof[k]={r:0,p:0};prof[k].r++;prof[k].p+=Number(r.points)||0});document.getElementById("profileStats").innerHTML=Object.entries(prof).sort((a,b)=>b[1].r-a[1].r).map(([k,v])=>`<div class="stat"><span>${esc(k)}<br><span class="small">${v.p} Punkte</span></span><strong>${v.r} Runden</strong></div>`).join("")||'<div class="empty">Noch keine Daten.</div>';
}
