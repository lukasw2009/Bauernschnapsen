'use strict';
(function(){
  const KEY='schnapsen_tracker_v3';
  const $=id=>document.getElementById(id);
  const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
  const clone=x=>JSON.parse(JSON.stringify(x));
  let reloading=false, decorating=false;

  function readData(){
    try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch{return null}
  }
  function writeData(d){
    try{localStorage.setItem(KEY,JSON.stringify(d));return true}catch{return false}
  }
  function activeProfile(d){return d?.profiles?.find(p=>String(p.id)===String(d.activeProfileId))||d?.profiles?.[0]||null}
  function playerName(d,id){return d?.players?.find(p=>String(p.id)===String(id))?.name||'Unbekannt'}
  function initialScore(d){const p=activeProfile(d);return p?(p.scoreMode==='down'?Number(p.limit)||0:0):0}
  function blankBoard(d){
    const start=initialScore(d);
    const dealer=d?.startDealerId&&d?.active?.includes(d.startDealerId)?d.startDealerId:(d?.active?.[0]||null);
    return{points:[start,start],bommerl:[0,0],over:false,dealerId:dealer};
  }
  function saveAndReload(d,page){
    if(reloading)return;
    d.ui=d.ui||{};
    if(page)d.ui.page=page;
    if(!writeData(d))return alert('Die Änderung konnte nicht gespeichert werden.');
    reloading=true;
    location.reload();
  }
  function removeSessionRecords(d,sessionId){
    const id=String(sessionId);
    d.rounds=(d.rounds||[]).filter(r=>String(r.sessionId||r.id)!==id);
    d.series=(d.series||[]).filter(s=>String(s.sessionId||s.id)!==id);
    d.endedSessions=(d.endedSessions||[]).filter(s=>String(s.sessionId||s.id)!==id);
  }
  function recordManualEnd(d){
    const sid=String(d.sessionId||'');
    const rounds=(d.rounds||[]).filter(r=>String(r.sessionId)===sid);
    const alreadyFinished=(d.series||[]).some(s=>String(s.sessionId)===sid);
    const alreadyEnded=(d.endedSessions||[]).some(s=>String(s.sessionId)===sid);
    if(!rounds.length||alreadyFinished||alreadyEnded)return;
    const p=activeProfile(d);
    const team1=[...(d.team1||[])];
    const team2=(d.active||[]).filter(id=>!team1.includes(id));
    d.endedSessions=d.endedSessions||[];
    d.endedSessions.unshift({
      id:(crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random()),
      sessionId:d.sessionId,
      at:new Date().toISOString(),
      profileId:p?.id||null,
      profileName:p?.name||'Regelprofil',
      team1,team2,
      board:clone(d.board||blankBoard(d)),
      rounds:rounds.length,
      reason:'manual'
    });
  }

  function endActiveGame(){
    const d=readData();
    if(!d?.started)return;
    const sid=String(d.sessionId||'');
    const rounds=(d.rounds||[]).filter(r=>String(r.sessionId)===sid);
    const won=(d.series||[]).some(s=>String(s.sessionId)===sid);
    if(!won&&rounds.length&&!confirm('Dieses Spiel wirklich beenden? Der aktuelle Stand bleibt im Verlauf.'))return;
    if(!won)recordManualEnd(d);
    d.started=false;
    saveAndReload(d,won?'history':'game');
  }

  function closeCompletedGame(){
    const d=readData();
    if(!d?.started||!d.board?.over)return false;
    const sid=String(d.sessionId||'');
    const finished=(d.series||[]).some(s=>String(s.sessionId)===sid);
    if(!finished)return false;
    d.started=false;
    saveAndReload(d,'history');
    return true;
  }

  function clearCurrentHistory(){
    const d=readData();
    if(!d?.started)return;
    const sid=String(d.sessionId||'');
    const count=(d.rounds||[]).filter(r=>String(r.sessionId)===sid).length;
    if(!count)return;
    if(!confirm('Punkteverlauf dieses Spiels löschen? Punktestand, Bommerl und Geber werden auf den Start zurückgesetzt.'))return;
    removeSessionRecords(d,sid);
    d.board=blankBoard(d);
    saveAndReload(d,'score');
  }

  function deleteSessionHistory(sessionId){
    const d=readData();if(!d)return;
    const sid=String(sessionId);
    const sessionRounds=(d.rounds||[]).filter(r=>String(r.sessionId||r.id)===sid);
    if(!sessionRounds.length)return;
    const active=d.started&&String(d.sessionId)===sid;
    const first=sessionRounds[sessionRounds.length-1]||sessionRounds[0];
    const n1=(first.team1||[]).map(id=>playerName(d,id)).join(' + ');
    const n2=(first.team2||[]).map(id=>playerName(d,id)).join(' + ');
    const msg=active
      ?'Diese komplette History des laufenden Spiels löschen? Der Spielstand wird auf den Start zurückgesetzt.'
      :`Partie ${n1||'Seite 1'} vs. ${n2||'Seite 2'} wirklich aus dem Verlauf löschen? Auch die zugehörige Statistik wird entfernt.`;
    if(!confirm(msg))return;
    removeSessionRecords(d,sid);
    if(active)d.board=blankBoard(d);
    saveAndReload(d,active?'score':'history');
  }

  function deleteSingleRound(roundId){
    const d=readData();if(!d)return;
    const round=(d.rounds||[]).find(r=>String(r.id)===String(roundId));if(!round)return;
    const sid=String(round.sessionId||round.id),active=d.started&&String(d.sessionId)===sid;
    if(active){
      const latest=(d.rounds||[]).find(r=>String(r.sessionId)===sid);
      if(!latest||String(latest.id)!==String(round.id))return alert('Bei einem laufenden Spiel kannst du nur die letzte Runde einzeln löschen. Für ältere Runden lösche den aktuellen Verlauf komplett.');
      if(!confirm('Letzte Runde wirklich aus der History löschen und den Spielstand zurücksetzen?'))return;
      d.rounds=d.rounds.filter(r=>String(r.id)!==String(round.id));
      d.series=(d.series||[]).filter(s=>String(s.sessionId)!==sid);
      d.endedSessions=(d.endedSessions||[]).filter(s=>String(s.sessionId)!==sid);
      d.board=clone(round.beforeBoard||blankBoard(d));
      d.board.over=false;
      saveAndReload(d,'score');
      return;
    }
    const hadResult=(d.series||[]).some(s=>String(s.sessionId)===sid)||(d.endedSessions||[]).some(s=>String(s.sessionId)===sid);
    const extra=hadResult?' Das gespeicherte Partieresultat wird ebenfalls entfernt, damit die Statistik nicht widersprüchlich wird.':'';
    if(!confirm('Diese Runde wirklich löschen?'+extra))return;
    d.rounds=d.rounds.filter(r=>String(r.id)!==String(round.id));
    if(hadResult){d.series=d.series.filter(s=>String(s.sessionId)!==sid);d.endedSessions=d.endedSessions.filter(s=>String(s.sessionId)!==sid)}
    saveAndReload(d,'history');
  }

  function matchesProfile(d,x,id){
    if(id==='all')return true;
    if(String(x.profileId||'')===String(id))return true;
    const p=(d.profiles||[]).find(p=>String(p.id)===String(id));
    return !x.profileId&&p?.name===x.profileName;
  }
  function filteredRounds(d){
    const ui=d.ui||{};
    let rows=(d.rounds||[]).filter(r=>matchesProfile(d,r,ui.historyProfile||'all'));
    if(ui.historyPlayer&&ui.historyPlayer!=='all')rows=rows.filter(r=>(r.team1||[]).includes(ui.historyPlayer)||(r.team2||[]).includes(ui.historyPlayer));
    if(ui.historyType&&ui.historyType!=='all')rows=rows.filter(r=>r.type===ui.historyType);
    if(ui.historyCurrent)rows=d.started?rows.filter(r=>String(r.sessionId)===String(d.sessionId)):[];
    return rows.slice().sort((a,b)=>(ui.historySort==='old'?1:-1)*(new Date(a.at)-new Date(b.at)));
  }
  function groupedSessions(d,rows){
    const groups=new Map();
    rows.forEach(r=>{const k=String(r.sessionId||r.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r)});
    const entries=[...groups.entries()].map(([id,rs])=>({id,stamp:Math.max(...rs.map(r=>+new Date(r.at)||0))}));
    entries.sort((a,b)=>((d.ui||{}).historySort==='old'?1:-1)*(a.stamp-b.stamp));
    return entries;
  }

  function ensureStyles(){
    if($('historyControlStyles'))return;
    const s=document.createElement('style');s.id='historyControlStyles';
    s.textContent=`.historyToolRow{display:flex;justify-content:flex-end;gap:7px;margin:8px 0 2px}.historyToolRow .btn{width:auto;padding:8px 10px;font-size:12px}.seriesRounds>.historyToolRow{margin:2px 0 8px}.roundDeleteWrap{display:flex;justify-content:flex-end;margin-top:7px}.roundDeleteWrap .btn{width:auto;padding:7px 9px;font-size:11px}.pointHistoryClear{width:auto!important;padding:8px 10px!important;font-size:12px!important}`;
    document.head.appendChild(s);
  }

  function decorateStand(d){
    const box=$('activePointHistory');if(!box)return;
    const count=d?.started?(d.rounds||[]).filter(r=>String(r.sessionId)===String(d.sessionId)).length:0;
    let row=$('activeHistoryTools');
    if(!row){
      row=document.createElement('div');row.id='activeHistoryTools';row.className='historyToolRow';
      const b=document.createElement('button');b.type='button';b.className='btn danger pointHistoryClear';b.id='clearActiveHistory';b.textContent='🗑 Verlauf löschen';b.onclick=clearCurrentHistory;row.appendChild(b);
      box.parentElement?.insertBefore(row,box);
    }
    row.classList.toggle('hidden',!count||!d?.started);
  }

  function decorateHistory(d){
    const host=$('history');if(!host||!d)return;
    const rows=filteredRounds(d),view=(d.ui||{}).historyView||'games';
    if(view==='games'){
      const entries=groupedSessions(d,rows),nodes=$$('.seriesGroup',host);
      nodes.forEach((node,i)=>{
        const info=entries[i];if(!info)return;
        let tools=node.querySelector(':scope > .seriesRounds > .historyToolRow');
        if(!tools){tools=document.createElement('div');tools.className='historyToolRow';node.querySelector('.seriesRounds')?.prepend(tools)}
        tools.innerHTML='';
        const b=document.createElement('button');b.type='button';b.className='btn danger';b.textContent='🗑 Partie löschen';b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteSessionHistory(info.id)};tools.appendChild(b);
      });
      return;
    }
    const nodes=$$('#history > .match',host.parentElement||document);
    nodes.forEach((node,i)=>{
      const r=rows[i];if(!r)return;
      let wrap=node.querySelector('.roundDeleteWrap');if(!wrap){wrap=document.createElement('div');wrap.className='roundDeleteWrap';node.appendChild(wrap)}
      wrap.innerHTML='';const b=document.createElement('button');b.type='button';b.className='btn danger';b.textContent='🗑 Runde löschen';b.onclick=()=>deleteSingleRound(r.id);wrap.appendChild(b);
    });
  }

  function decorate(){
    if(decorating||reloading)return;decorating=true;
    try{
      ensureStyles();
      const d=readData();
      const end=$('endGame');
      if(end){end.onclick=endActiveGame;const shouldDisable=!d?.started;if(end.disabled!==shouldDisable)end.disabled=shouldDisable}
      decorateStand(d);decorateHistory(d);
    }finally{decorating=false}
  }

  function scheduleDecorate(){setTimeout(decorate,0)}

  ['win1','win2'].forEach(id=>{
    const b=$(id);if(b)b.addEventListener('click',()=>setTimeout(()=>{if(!closeCompletedGame())scheduleDecorate()},30));
  });
  const observer=new MutationObserver(scheduleDecorate);
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
  window.addEventListener('pageshow',()=>{if(!closeCompletedGame())decorate()});
  if(!closeCompletedGame())decorate();
})();
