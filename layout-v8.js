// Mobile-first Seitenlayout v8: kurze Ansichten, Aktionsmenü und Unterseiten.
(function(){
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  function ensureUiState(){
    data.ui=data.ui||{};
    data.ui.v8Page=data.ui.v8Page||'game';
    data.ui.v8More=data.ui.v8More||'players';
    data.ui.v8Stats=data.ui.v8Stats||'overview';
    data.ui.v8Rules=data.ui.v8Rules||'profile';
    if(typeof data.ui.v8HistoryFilters!=='boolean')data.ui.v8HistoryFilters=false;
    if(typeof data.ui.v8StatsFilters!=='boolean')data.ui.v8StatsFilters=false;
  }
  ensureUiState();

  function make(tag,cls,html){const el=document.createElement(tag);if(cls)el.className=cls;if(html!=null)el.innerHTML=html;return el}

  function ensureScorePage(){
    let page=q('#page-score');
    if(!page){
      page=make('section','hidden');page.id='page-score';
      page.innerHTML='<div id="scoreEmptyV8" class="card v8Empty"><div class="v8EmptyIcon">🎴</div><h2>Kein aktives Spiel</h2><div class="small">Starte zuerst eine Partie. Danach findest du hier Spielstand, Bommerl, Geber und Punkteverlauf.</div><button id="scoreToGameV8" class="btn good">Spiel starten</button></div>';
      q('#page-history').insertAdjacentElement('beforebegin',page);
    }
    const card=q('#activeGameCard');
    if(card&&card.parentElement!==page)page.appendChild(card);
    q('#scoreToGameV8')?.addEventListener('click',()=>showMainPage('game'));
  }

  function ensureRoundCompactBar(){
    const active=q('#activeGame');if(!active)return;
    let bar=q('#compactGameBarV8');
    if(!bar){
      bar=make('div','v8CompactBar');bar.id='compactGameBarV8';
      bar.innerHTML='<button id="compactToScoreV8" class="v8CompactScore" type="button"><span id="compactNamesV8">Spielstand</span><strong id="compactScoreV8">– : –</strong></button><div class="v8CompactSide"><span id="compactDealerV8">🂠 –</span><button id="compactMenuV8" class="v8IconBtn" type="button" aria-label="Spielaktionen">•••</button></div>';
      active.insertAdjacentElement('afterbegin',bar);
      q('#compactToScoreV8').onclick=()=>showMainPage('score');
      q('#compactMenuV8').onclick=openGameMenu;
    }
    const roundCard=[...active.children].find(el=>el.classList?.contains('card')&&el.id!=='activeGameCard');
    if(roundCard)roundCard.id='roundEntryCardV8';
  }

  function ensureGameActionMenu(){
    if(q('#gameActionsV8'))return;
    const overlay=make('div','v8SheetOverlay hidden');overlay.id='gameActionsV8';
    overlay.innerHTML='<div class="v8Sheet"><div class="v8SheetHead"><div><strong>Spielaktionen</strong><span>Seltene Aktionen sind hier gesammelt.</span></div><button id="closeGameMenuV8" class="v8IconBtn" type="button">×</button></div><div id="gameActionsListV8" class="v8ActionList"></div></div>';
    document.body.appendChild(overlay);
    q('#closeGameMenuV8').onclick=closeGameMenu;
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeGameMenu()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeGameMenu()});
  }
  function openGameMenu(){q('#gameActionsV8')?.classList.remove('hidden');document.body.classList.add('v8NoScroll')}
  function closeGameMenu(){q('#gameActionsV8')?.classList.add('hidden');document.body.classList.remove('v8NoScroll')}

  function moveGameActions(){
    ensureGameActionMenu();
    const list=q('#gameActionsListV8');if(!list)return;
    const defs=[
      ['editGameSetup','↩️','Setup ändern','Spieler, Teams oder Geber neu festlegen'],
      ['undoRound','↶','Letzte Runde zurück','Letzten Eintrag rückgängig machen'],
      ['newSeries','＋','Neue Partie','Mit denselben Spielern neu beginnen'],
      ['endGameV7','■','Spiel beenden','Vorzeitig und ohne Sieger beenden']
    ];
    defs.forEach(([id,icon,title,desc])=>{
      const btn=q('#'+id);if(!btn)return;
      if(btn.dataset.v8Moved)return;
      const old=btn.onclick;
      btn.dataset.v8Moved='1';btn.className='v8ActionBtn';btn.innerHTML=`<span class="v8ActionIcon">${icon}</span><span><strong>${title}</strong><small>${desc}</small></span>`;
      btn.onclick=function(e){closeGameMenu();old?.call(this,e);if((id==='editGameSetup'||id==='endGameV7')&&!data.started)showMainPage('game')};
      list.appendChild(btn);
    });
    const sum=q('#activeGameCard .setupSummary');
    if(sum&&!q('#scoreMenuV8')){
      const menu=make('button','v8IconBtn');menu.id='scoreMenuV8';menu.type='button';menu.textContent='•••';menu.setAttribute('aria-label','Spielaktionen');menu.onclick=openGameMenu;sum.appendChild(menu);
    }
    qa('#activeGameCard .row').forEach(r=>{if(!r.children.length)r.remove()});
  }

  function ensureMorePages(){
    let more=q('#page-more');
    if(!more){
      more=make('section','hidden');more.id='page-more';
      more.innerHTML='<div class="v8SubNav card"><button data-more="players">👥 Spieler</button><button data-more="rules">⚙️ Regeln</button><button data-more="data">💾 Daten</button></div>';
      q('#page-players').insertAdjacentElement('beforebegin',more);
      qa('[data-more]',more).forEach(b=>b.onclick=()=>showMore(b.dataset.more));
    }
    let dataPage=q('#page-data');
    if(!dataPage){dataPage=make('section','hidden');dataPage.id='page-data';q('#page-rules').insertAdjacentElement('afterend',dataPage)}
    const reset=q('#resetAll');const card=reset?.closest('.card');if(card&&card.parentElement!==dataPage)dataPage.appendChild(card);
  }

  function ensureHistoryCompact(){
    const page=q('#page-history');if(!page)return;
    const filterCard=qa(':scope > .card',page)[0];if(!filterCard)return;
    filterCard.id='historyFilterCardV8';
    if(!q('#historyFilterToggleV8')){
      const head=make('div','v8PageToolbar');head.innerHTML='<div><strong>Verlauf</strong><span id="historyFilterStateV8">Alle Einträge</span></div><button id="historyFilterToggleV8" class="btn secondary">Filter</button>';
      page.insertAdjacentElement('afterbegin',head);q('#historyFilterToggleV8').onclick=()=>{data.ui.v8HistoryFilters=!data.ui.v8HistoryFilters;save();renderV8()};
    }
  }

  function ensureStatsTabs(){
    const page=q('#page-stats');if(!page)return;
    const cards=qa(':scope > .card',page);if(cards.length<5)return;
    cards[0].id='statsFilterCardV8';
    const byTitle={};cards.slice(1).forEach(c=>{const t=q('h2',c)?.textContent.trim();if(t)byTitle[t]=c});
    if(byTitle['Gesamt'])byTitle['Gesamt'].dataset.statsPane='overview';
    if(byTitle['Regelprofile'])byTitle['Regelprofile'].dataset.statsPane='overview';
    if(byTitle['Spieler'])byTitle['Spieler'].dataset.statsPane='players';
    if(byTitle['Teams / Seiten'])byTitle['Teams / Seiten'].dataset.statsPane='teams';
    if(byTitle['Ansagen'])byTitle['Ansagen'].dataset.statsPane='types';
    if(!q('#statsTabsV8')){
      const nav=make('div','v8StatsHead');nav.id='statsTabsV8';nav.innerHTML='<div class="v8SubNav"><button data-stats="overview">Übersicht</button><button data-stats="players">Spieler</button><button data-stats="teams">Teams</button><button data-stats="types">Ansagen</button></div><button id="statsFilterToggleV8" class="btn secondary v8FilterBtn">Filter</button>';
      page.insertBefore(nav,cards[0]);
      qa('[data-stats]',nav).forEach(b=>b.onclick=()=>{data.ui.v8Stats=b.dataset.stats;save();renderV8()});
      q('#statsFilterToggleV8').onclick=()=>{data.ui.v8StatsFilters=!data.ui.v8StatsFilters;save();renderV8()};
    }
  }

  function ensureRulesTabs(){
    const page=q('#page-rules');if(!page)return;
    const cards=qa(':scope > .card',page);if(cards.length<3)return;
    cards[0].dataset.rulesPane='profile';
    cards[1].dataset.rulesPane='general';
    cards[2].dataset.rulesPane='announcements';
    const save=q('#saveProfile');const saveCard=save?.closest('.card');if(saveCard)saveCard.dataset.rulesSave='1';
    if(!q('#rulesTabsV8')){
      const head=make('div','v8RulesHead');head.id='rulesTabsV8';head.innerHTML='<div class="v8SubNav"><button data-rules="profile">Profil</button><button data-rules="general">Grundregeln</button><button data-rules="announcements">Ansagen</button></div><div id="rulesSaveSlotV8"></div>';
      page.insertAdjacentElement('afterbegin',head);
      qa('[data-rules]',head).forEach(b=>b.onclick=()=>{data.ui.v8Rules=b.dataset.rules;save();renderV8()});
      if(save){save.classList.add('v8SaveBtn');q('#rulesSaveSlotV8').appendChild(save)}
      if(saveCard&&saveCard!==save.parentElement)saveCard.classList.add('hidden');
    }
  }

  function collapseDealerSetup(){
    const d=q('#dealerSetupV7');if(!d||d.dataset.v8Ready)return;
    d.dataset.v8Ready='1';
    const content=make('div','v8DealerContent');
    while(d.firstChild)content.appendChild(d.firstChild);
    const toggle=make('button','v8DealerToggle');toggle.type='button';toggle.innerHTML='<span><strong>🂠 Geber & Sitzreihenfolge</strong><small id="dealerSetupSummaryV8">Automatisch</small></span><b>▾</b>';
    d.append(toggle,content);toggle.onclick=()=>{d.classList.toggle('v8Open');toggle.querySelector('b').textContent=d.classList.contains('v8Open')?'▴':'▾'};
  }

  function buildBottomNav(){
    const nav=q('.navin');if(!nav||nav.dataset.v8)return;nav.dataset.v8='1';
    nav.innerHTML='<button class="tab" data-v8-page="game">🎴<br>Runde</button><button class="tab" data-v8-page="score">🏁<br>Stand</button><button class="tab" data-v8-page="history">🕘<br>Verlauf</button><button class="tab" data-v8-page="stats">📊<br>Statistik</button><button class="tab" data-v8-page="more">☰<br>Mehr</button>';
    qa('[data-v8-page]',nav).forEach(b=>b.onclick=()=>showMainPage(b.dataset.v8Page));
    const gr=q('#goRules');if(gr)gr.onclick=()=>{data.ui.v8More='rules';data.ui.v8Rules='profile';save();showMainPage('more')};
  }

  function showMore(tab){data.ui.v8More=tab;save();renderV8();window.scrollTo({top:0,behavior:'smooth'})}
  function showMainPage(page){
    data.ui.v8Page=page;save();renderV8();window.scrollTo({top:0,behavior:'smooth'});
  }
  window.showMainPageV8=showMainPage;

  function renderCompactBar(){
    const bar=q('#compactGameBarV8');if(!bar)return;bar.classList.toggle('hidden',!data.started);
    if(!data.started)return;
    q('#compactNamesV8').textContent=`${data.team1.map(pname).join(' + ')} vs ${side2().map(pname).join(' + ')}`;
    q('#compactScoreV8').textContent=scorePair(data.board);
    q('#compactDealerV8').textContent=`🂠 ${data.board?.dealerId?pname(data.board.dealerId):'—'}`;
  }

  function renderNavigation(){
    const page=data.ui.v8Page||'game';
    ['game','score','history','stats','more','players','rules','data'].forEach(p=>q('#page-'+p)?.classList.add('hidden'));
    q('#page-'+page)?.classList.remove('hidden');
    if(page==='more'){
      q('#page-more')?.classList.remove('hidden');
      const sub=data.ui.v8More||'players';q('#page-'+sub)?.classList.remove('hidden');
      qa('[data-more]').forEach(b=>b.classList.toggle('active',b.dataset.more===sub));
    }
    qa('[data-v8-page]').forEach(b=>b.classList.toggle('active',b.dataset.v8Page===page));
    q('#activeGameCard')?.classList.toggle('hidden',!data.started);
    q('#scoreEmptyV8')?.classList.toggle('hidden',!!data.started);
  }

  function renderHistoryLayout(){
    const card=q('#historyFilterCardV8');if(card)card.classList.toggle('v8Collapsed',!data.ui.v8HistoryFilters);
    const label=q('#historyFilterStateV8');if(label){
      const active=[];if(data.ui.historyProfile&&data.ui.historyProfile!=='all')active.push('Profil');if(data.ui.historyPlayer&&data.ui.historyPlayer!=='all')active.push('Spieler');if(data.ui.historyType&&data.ui.historyType!=='all')active.push('Ansage');if(data.ui.historyCurrent)active.push('aktuelles Spiel');label.textContent=active.length?active.join(' · '):'Alle Einträge';
    }
    const btn=q('#historyFilterToggleV8');if(btn)btn.textContent=data.ui.v8HistoryFilters?'Filter schließen':'Filter';
  }

  function renderStatsLayout(){
    const current=data.ui.v8Stats||'overview';
    qa('[data-stats-pane]').forEach(c=>c.classList.toggle('hidden',c.dataset.statsPane!==current));
    qa('[data-stats]').forEach(b=>b.classList.toggle('active',b.dataset.stats===current));
    q('#statsFilterCardV8')?.classList.toggle('v8Collapsed',!data.ui.v8StatsFilters);
    const b=q('#statsFilterToggleV8');if(b)b.textContent=data.ui.v8StatsFilters?'Filter schließen':'Filter';
  }

  function renderRulesLayout(){
    const current=data.ui.v8Rules||'profile';
    qa('[data-rules-pane]').forEach(c=>c.classList.toggle('hidden',c.dataset.rulesPane!==current));
    qa('[data-rules]').forEach(b=>b.classList.toggle('active',b.dataset.rules===current));
    qa('[data-rules-save]').forEach(c=>c.classList.add('hidden'));
  }

  function renderDealerSummary(){
    const el=q('#dealerSetupSummaryV8');if(el){const id=data.startDealerId;el.textContent=id?`Start: ${pname(id)}`:'Automatisch'}
  }

  function renderV8(){
    ensureUiState();ensureScorePage();ensureRoundCompactBar();ensureGameActionMenu();moveGameActions();ensureMorePages();ensureHistoryCompact();ensureStatsTabs();ensureRulesTabs();collapseDealerSetup();buildBottomNav();
    renderCompactBar();renderNavigation();renderHistoryLayout();renderStatsLayout();renderRulesLayout();renderDealerSummary();
  }

  const startBtn=q('#startGame'),oldStart=startBtn?.onclick;if(startBtn&&oldStart&&!startBtn.dataset.v8Wrap){startBtn.dataset.v8Wrap='1';startBtn.onclick=function(e){oldStart.call(this,e);if(data.started){data.ui.v8Page='game';save();renderV8()}}}

  const oldRenderAll=window.renderAll;
  if(typeof oldRenderAll==='function'&&!window.__v8RenderWrapped){
    window.__v8RenderWrapped=true;
    window.renderAll=function(){oldRenderAll();renderV8()};
  }
  renderV8();
})();
