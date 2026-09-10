// Geber-Rotation + manuelles Beenden aktiver Partien (v7)
(function(){
  function clone7(x){return JSON.parse(JSON.stringify(x))}
  function ensureDealerState(){
    if(!Array.isArray(data.endedSessions))data.endedSessions=[];
    if(!data.startDealerId||!data.active.includes(data.startDealerId))data.startDealerId=data.active[0]||null;
    if(data.board&&!data.board.dealerId)data.board.dealerId=data.startDealerId||data.active[0]||null;
  }
  ensureDealerState();

  const previousBlankBoard=blankBoard;
  blankBoard=function(){
    const b=previousBlankBoard();
    ensureDealerState();
    b.dealerId=(data.startDealerId&&data.active.includes(data.startDealerId))?data.startDealerId:(data.active[0]||null);
    return b;
  };

  function currentDealerId(){
    ensureDealerState();
    return data.board?.dealerId&&data.active.includes(data.board.dealerId)?data.board.dealerId:(data.startDealerId||data.active[0]||null);
  }
  function nextDealerId(id){
    if(!data.active.length)return null;
    const i=data.active.indexOf(id);
    return data.active[(i<0?0:i+1)%data.active.length];
  }

  function injectDealerStyles(){
    if(document.getElementById('dealerV7Styles'))return;
    const st=document.createElement('style');st.id='dealerV7Styles';st.textContent=`
      .dealerSetup{margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:18px;background:linear-gradient(180deg,rgba(12,18,34,.8),rgba(9,14,27,.88))}
      .dealerSetupTitle{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-weight:900}
      .dealerOrder{display:flex;flex-direction:column;gap:6px;margin:8px 0}
      .dealerSeat{display:grid;grid-template-columns:38px 1fr 38px;gap:6px;align-items:center;padding:7px;background:rgba(19,28,48,.76);border:1px solid var(--line);border-radius:13px}
      .dealerSeat>span{text-align:center;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .dealerMove{width:38px!important;padding:7px!important;border-radius:10px!important}
      .dealerBanner{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:12px 14px;border:1px solid rgba(251,191,36,.25);border-radius:17px;background:linear-gradient(135deg,rgba(67,47,10,.42),rgba(25,23,31,.86))}
      .dealerBanner span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}
      .dealerBanner strong{display:block;color:var(--gold);font-size:18px;margin-top:2px}
      .dealerBanner small{color:var(--muted);text-align:right;line-height:1.35}
      .endGameBtn{margin-top:9px;background:linear-gradient(180deg,rgba(251,113,133,.16),rgba(96,28,43,.22))!important;color:#ffd5dc!important;border:1px solid rgba(251,113,133,.32)!important;box-shadow:none!important}
      .manualEnded{color:var(--danger)!important}
      @media(max-width:430px){.dealerBanner{align-items:flex-start;flex-direction:column}.dealerBanner small{text-align:left}.dealerSeat{grid-template-columns:36px 1fr 36px}}
    `;document.head.appendChild(st);
  }

  function ensureDealerUi(){
    injectDealerStyles();
    const setupTeams=document.querySelector('#gameSetup .teams');
    if(setupTeams&&!document.getElementById('dealerSetupV7')){
      const d=document.createElement('div');d.id='dealerSetupV7';d.className='dealerSetup';
      d.innerHTML=`<div class="dealerSetupTitle"><span>🂠 Geber</span><span class="small">geht jede Runde weiter</span></div><div class="small">Sitzreihenfolge festlegen. Danach den ersten Geber auswählen.</div><div id="dealerOrderV7" class="dealerOrder"></div><div class="field"><span class="label">Erster Geber</span><select id="startDealerV7"></select></div>`;
      setupTeams.insertAdjacentElement('afterend',d);
    }
    const status=document.getElementById('gameStatus');
    if(status&&!document.getElementById('dealerBannerV7')){
      const d=document.createElement('div');d.id='dealerBannerV7';d.className='dealerBanner';
      d.innerHTML='<div><span>🂠 Aktueller Geber</span><strong id="dealerNameV7">—</strong></div><small id="nextDealerV7">Nächster: —</small>';
      status.insertAdjacentElement('afterend',d);
    }
    const activeCard=document.getElementById('activeGameCard');
    if(activeCard&&!document.getElementById('endGameV7')){
      const b=document.createElement('button');b.id='endGameV7';b.className='btn endGameBtn';b.textContent='■ Spiel beenden';
      activeCard.appendChild(b);b.onclick=endActiveGameV7;
    }
  }

  function moveSeat(index,dir){
    if(data.started||data.active.length<2)return;
    const target=index+dir;if(target<0||target>=data.active.length)return;
    [data.active[index],data.active[target]]=[data.active[target],data.active[index]];
    if(!data.active.includes(data.startDealerId))data.startDealerId=data.active[0]||null;
    resetBoard();save();renderAll();
  }

  function renderDealerUi(){
    ensureDealerUi();ensureDealerState();
    const order=document.getElementById('dealerOrderV7'),sel=document.getElementById('startDealerV7');
    if(order){
      if(!data.active.length)order.innerHTML='<div class="small">Zuerst Spieler auswählen.</div>';
      else order.innerHTML=data.active.map((id,i)=>`<div class="dealerSeat"><button type="button" class="btn secondary dealerMove" data-i="${i}" data-dir="-1" ${i===0?'disabled':''}>↑</button><span>${i+1}. ${esc(pname(id))}</span><button type="button" class="btn secondary dealerMove" data-i="${i}" data-dir="1" ${i===data.active.length-1?'disabled':''}>↓</button></div>`).join('');
      order.querySelectorAll?.('.dealerMove').forEach(b=>b.onclick=()=>moveSeat(Number(b.dataset.i),Number(b.dataset.dir)));
    }
    if(sel){
      sel.innerHTML=data.active.map(id=>`<option value="${id}">${esc(pname(id))}</option>`).join('');
      if(data.active.length){if(!data.active.includes(data.startDealerId))data.startDealerId=data.active[0];sel.value=data.startDealerId;}
      sel.disabled=!!data.started||!data.active.length;
      sel.onchange=e=>{data.startDealerId=e.target.value;data.board.dealerId=data.startDealerId;save();renderDealerUi()};
    }
    const current=currentDealerId(),next=nextDealerId(current),name=document.getElementById('dealerNameV7'),nextEl=document.getElementById('nextDealerV7');
    if(name)name.textContent=current?pname(current):'—';
    if(nextEl)nextEl.textContent=next&&data.active.length>1?`Nächster: ${pname(next)}`:'Nächster: —';
    const end=document.getElementById('endGameV7');if(end)end.disabled=!data.started||data.board.over;
  }

  const previousRenderGame=renderGame;
  renderGame=function(){previousRenderGame();renderDealerUi()};

  const previousAddRound=addRound;
  addRound=function(winner){
    ensureDealerState();
    const count=data.rounds.length,dealer=currentDealerId();
    previousAddRound(winner);
    if(data.rounds.length!==count+1||data.rounds[0]?.sessionId!==data.sessionId)return;
    const r=data.rounds[0],next=nextDealerId(dealer);
    r.dealerId=dealer;
    if(data.board)data.board.dealerId=next;
    if(r.afterBoard)r.afterBoard.dealerId=next;
    save();renderAll();
  };

  if(typeof roundCard==='function'){
    const previousRoundCard=roundCard;
    roundCard=function(r,compact=false){
      let html=previousRoundCard(r,compact);
      if(r.dealerId)html=html.replace('<div class="meta">',`<div class="meta">🂠 Geber: ${esc(pname(r.dealerId))} · `);
      return html;
    };
  }

  renderGroupedHistory=function(rows,box){
    ensureDealerState();
    const groups=new Map();rows.forEach(r=>{const k=r.sessionId||r.id;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)});
    const entries=[...groups.entries()];
    box.innerHTML=entries.map(([session,rs])=>{
      const sorted=rs.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)),first=sorted[0],last=sorted[sorted.length-1],series=data.series.find(s=>s.sessionId===session),ended=data.endedSessions.find(s=>s.sessionId===session);
      const n1=first.team1.map(pname).join(' + '),n2=first.team2.map(pname).join(' + ');
      const when=new Date(first.at).toLocaleString('de-AT',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});
      const winner=series?(series.winner===1?n1:n2):null;
      const result=winner?`Gewonnen: ${winner}`:ended?'Manuell beendet':(session===data.sessionId&&data.started?'Aktives Spiel':'Nicht beendet');
      const board=ended?.board||last.afterBoard,bombs=board?.bommerl?.length===2?`${board.bommerl[0]} : ${board.bommerl[1]} Bommerl`:'';
      return `<details class="seriesGroup" ${session===data.sessionId&&data.started?'open':''}><summary><div><strong>${esc(n1)} <span class="mutedVs">vs.</span> ${esc(n2)}</strong><span>${esc(first.profileName||'Regelprofil')} · ${when}</span></div><div class="seriesResult ${ended&&!winner?'manualEnded':''}">${esc(result)}${bombs?`<small>${esc(bombs)}</small>`:''}</div></summary><div class="seriesRounds">${sorted.map(r=>roundCard(r,true)).join('')}</div></details>`;
    }).join('');
  };

  function endActiveGameV7(){
    if(!data.started)return;
    const rounds=currentSessionRounds();
    const text=rounds.length?'Dieses Spiel wirklich vorzeitig beenden? Der aktuelle Stand und alle Runden bleiben im Verlauf.':'Dieses noch leere Spiel beenden?';
    if(!confirm(text))return;
    if(rounds.length&&!data.endedSessions.some(s=>s.sessionId===data.sessionId)){
      const p=profile(),teams=teamSnapshot();
      data.endedSessions.unshift({id:uid(),sessionId:data.sessionId,at:new Date().toISOString(),profileId:p.id,profileName:p.name,team1:[...teams.team1],team2:[...teams.team2],board:clone7(data.board),rounds:rounds.length,reason:'manual'});
    }
    data.started=false;save();renderAll();window.scrollTo({top:0,behavior:'smooth'});
  }

  ensureDealerUi();renderAll();
})();
