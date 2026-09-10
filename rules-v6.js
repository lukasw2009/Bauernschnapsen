// Flexible Wertungs-Engine v6. Wird nach den v5-Upgrades geladen.
(function(){
  function modId(){return 'm_'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'_'+Math.random()).replaceAll('-','')}
  function migrateProfile(p){
    if(!Array.isArray(p.modifiers)){
      const mods=[];
      if(p.mods?.half) mods.push({id:'half',name:'Halbiert',operation:'multiply',value:0.5,rounding:p.mods.halfRound||'ceil'});
      if(p.mods?.fleck) mods.push({id:'fleck',name:'Gefleckt',operation:'multiply',value:Number(p.mods.fleckFactor)||2,rounding:'none'});
      if(p.mods?.double) mods.push({id:'double',name:'Doppelfleck',operation:'multiply',value:Number(p.mods.doubleFactor)||4,rounding:'none'});
      p.modifiers=mods;
    }
    p.modifiers=p.modifiers.map((m,i)=>({
      id:String(m.id||modId()),
      name:String(m.name||`Wertung ${i+1}`),
      operation:['multiply','add'].includes(m.operation)?m.operation:'multiply',
      value:Number.isFinite(Number(m.value))?Number(m.value):1,
      rounding:['none','ceil','floor','round'].includes(m.rounding)?m.rounding:'none'
    }));
    (p.announcements||[]).forEach(a=>{
      if(!Array.isArray(a.allowedModifierIds)) a.allowedModifierIds=a.fixed?[]:p.modifiers.map(m=>m.id);
      a.allowedModifierIds=a.allowedModifierIds.filter(id=>p.modifiers.some(m=>m.id===id));
      a.fixed=a.allowedModifierIds.length===0;
    });
  }
  data.profiles.forEach(migrateProfile);
  if(!data.ui)data.ui={};
  save();

  function legacyModifierArea(){
    const page=document.getElementById('page-rules');
    if(!page)return;
    const heading=[...page.querySelectorAll('h3')].find(h=>h.textContent.includes('Erlaubte Wertungen'));
    if(heading)heading.classList.add('v6LegacyHidden');
    const ids=['rHalf','rFleck','rDouble','rFleckFactor','rDoubleFactor','rHalfRound'];
    ids.forEach(id=>{
      const el=document.getElementById(id);if(!el)return;
      const host=el.closest('.field')||el.closest('.checkrow')||el.parentElement;
      if(host)host.classList.add('v6LegacyHidden');
    });
    const oldChecks=document.getElementById('rHalf')?.closest('.checkrow');if(oldChecks)oldChecks.classList.add('v6LegacyHidden');
  }

  function ensureEngineUi(){
    legacyModifierArea();
    const rulesCard=document.getElementById('rHalf')?.closest('.card');
    if(rulesCard&&!document.getElementById('modifierEditorV6')){
      const block=document.createElement('div');
      block.className='v6RuleBlock';
      block.innerHTML=`<div class="v6RuleHead"><div><h3>Wertungen / Modifier</h3><div class="small">Diese Optionen werden einmal im Regelprofil definiert und erscheinen danach automatisch beim Spielen.</div></div></div><div id="modifierEditorV6"></div><button class="btn secondary" id="addModifierV6">+ Wertung hinzufügen</button><div class="note v6Example">Beispiele: „Halbiert“ = ×0,5 + Aufrunden · „Fleck“ = ×2 · „Doppelfleck“ = ×4. Du kannst auch eigene Namen oder +Punkte-Regeln anlegen.</div>`;
      rulesCard.appendChild(block);
      block.querySelector('#addModifierV6').onclick=()=>{
        const p=editing();
        readEditorInto(p);
        p.modifiers.push({id:modId(),name:'Neue Wertung',operation:'multiply',value:2,rounding:'none'});
        renderModifierEditorV6(p);
        renderAnnouncementEditor(p.announcements);
      };
    }
    const annCard=document.getElementById('announcementEditor')?.closest('.card');
    const oldHint=annCard?.querySelector('.small[style*="margin-top:8px"]');
    if(oldHint)oldHint.textContent='Bei jeder Ansage stellst du hier einmal ein, welche Wertungen aus diesem Regelprofil erlaubt sind. Im laufenden Spiel musst du das nicht erneut festlegen.';
  }

  function applyRound(v,rounding){
    if(rounding==='ceil')return Math.ceil(v);
    if(rounding==='floor')return Math.floor(v);
    if(rounding==='round')return Math.round(v);
    return Math.round(v*1000)/1000;
  }
  function activeModifierDef(){return profile().modifiers?.find(m=>m.id===modifier)||null}

  window.roundValue=function(){
    const a=selectedAnnouncement();
    let v=a.normal?Number(normalPoints):Number(a.points)||0;
    const m=activeModifierDef();
    if(!m)return v;
    if(m.operation==='add')v+=Number(m.value)||0;else v*=Number(m.value)||0;
    return applyRound(v,m.rounding);
  };
  window.modifierLabel=function(){
    if(modifier==='base'||modifier==='normal'||!modifier)return 'Normal';
    return activeModifierDef()?.name||'Normal';
  };

  window.renderRoundControls=function(){
    const p=profile();migrateProfile(p);
    const gt=document.getElementById('gameType'),old=gt.value;
    gt.innerHTML='<option value="__normal">Normal</option>'+p.announcements.map((a,i)=>`<option value="${i}">${esc(a.name)} · ${a.points}</option>`).join('');
    if([...gt.options].some(o=>o.value===old))gt.value=old;else gt.value='__normal';
    const ab=document.getElementById('announcementButtons');
    if(ab){
      ab.innerHTML='';
      [...gt.options].forEach(o=>{const b=document.createElement('button');b.className='announce-btn'+(gt.value===o.value?' active':'');b.textContent=o.textContent;b.onclick=()=>{gt.value=o.value;modifier='base';renderRoundControls()};ab.appendChild(b)});
    }
    const np=document.getElementById('normalPointsButtons');np.innerHTML='';
    if(!p.normalPoints.includes(normalPoints))normalPoints=p.normalPoints[0]??1;
    p.normalPoints.forEach(n=>{const b=document.createElement('button');b.className='mod-btn'+(normalPoints===n?' active':'');b.textContent=n;b.onclick=()=>{normalPoints=n;renderRoundControls()};np.appendChild(b)});
    const a=selectedAnnouncement();
    document.getElementById('normalPointsWrap').classList.toggle('hidden',!a.normal);
    const allowedIds=a.normal?p.modifiers.map(m=>m.id):(Array.isArray(a.allowedModifierIds)?a.allowedModifierIds:p.modifiers.map(m=>m.id));
    if(!['base','normal'].includes(modifier)&&!allowedIds.includes(modifier))modifier='base';
    if(modifier==='normal')modifier='base';
    const mb=document.getElementById('modifierButtons');mb.innerHTML='';
    const base=document.createElement('button');base.className='mod-btn'+(modifier==='base'?' active':'');base.textContent='Normal';base.onclick=()=>{modifier='base';renderRoundControls()};mb.appendChild(base);
    p.modifiers.filter(m=>allowedIds.includes(m.id)).forEach(m=>{const b=document.createElement('button');b.className='mod-btn'+(modifier===m.id?' active':'');b.textContent=m.name;b.onclick=()=>{modifier=m.id;renderRoundControls()};mb.appendChild(b)});
    const fixed=!a.normal&&allowedIds.length===0;
    document.getElementById('fixedNote').classList.toggle('hidden',!fixed);
    if(fixed)document.getElementById('fixedNote').textContent='Für diese Ansage ist im Regelprofil nur die fixe Grundwertung erlaubt.';
    document.getElementById('roundValue').textContent=roundValue();
    document.getElementById('win1').disabled=!data.started||!ready()||data.board.over;
    document.getElementById('win2').disabled=!data.started||!ready()||data.board.over;
    document.getElementById('undoRound').disabled=!data.rounds.length||data.rounds[0].sessionId!==data.sessionId;
  };

  function renderModifierEditorV6(p){
    const box=document.getElementById('modifierEditorV6');if(!box)return;migrateProfile(p);
    if(!p.modifiers.length){box.innerHTML='<div class="empty">Keine zusätzlichen Wertungen. Es gibt dann nur „Normal“.</div>';return}
    box.innerHTML=p.modifiers.map((m,i)=>`<div class="v6ModifierRow" data-i="${i}"><input class="miniInput v6-mod-name" value="${esc(m.name)}" maxlength="28"><select class="miniInput v6-mod-op"><option value="multiply" ${m.operation==='multiply'?'selected':''}>× Faktor</option><option value="add" ${m.operation==='add'?'selected':''}>+ Punkte</option></select><input class="miniInput v6-mod-value" type="number" step="0.1" value="${m.value}"><select class="miniInput v6-mod-round"><option value="none" ${m.rounding==='none'?'selected':''}>exakt</option><option value="ceil" ${m.rounding==='ceil'?'selected':''}>aufrunden</option><option value="floor" ${m.rounding==='floor'?'selected':''}>abrunden</option><option value="round" ${m.rounding==='round'?'selected':''}>normal runden</option></select><button class="btn danger v6-mod-del" type="button">×</button></div>`).join('');
    box.querySelectorAll('.v6-mod-del').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.closest('.v6ModifierRow').dataset.i),removed=p.modifiers[i]?.id;
      p.modifiers.splice(i,1);
      p.announcements.forEach(a=>a.allowedModifierIds=(a.allowedModifierIds||[]).filter(id=>id!==removed));
      renderModifierEditorV6(p);renderAnnouncementEditor(p.announcements);
    });
  }

  window.renderAnnouncementEditor=function(arr){
    const p=editing();migrateProfile(p);
    const box=document.getElementById('announcementEditor');box.innerHTML='';
    if(!arr.length){box.innerHTML='<div class="empty">Keine zusätzlichen Ansagen. „Normal“ ist immer vorhanden.</div>';return}
    arr.forEach((a,i)=>{
      if(!Array.isArray(a.allowedModifierIds))a.allowedModifierIds=a.fixed?[]:p.modifiers.map(m=>m.id);
      const r=document.createElement('div');r.className='v6Announce';r.dataset.i=i;
      r.innerHTML=`<div class="v6AnnounceMain"><input class="miniInput ann-name" maxlength="35" value="${esc(a.name)}"><input class="miniInput ann-points" type="number" min="0" step=".5" value="${a.points}"><button class="btn danger ann-del" type="button">×</button></div><details class="v6Allowed"><summary>Erlaubte Wertungen <span class="small">(${a.allowedModifierIds.length?p.modifiers.filter(m=>a.allowedModifierIds.includes(m.id)).map(m=>m.name).join(', '):'nur Normal'})</span></summary><div class="v6ModifierChecks">${p.modifiers.map(m=>`<label class="check"><input class="ann-mod" type="checkbox" value="${m.id}" ${a.allowedModifierIds.includes(m.id)?'checked':''}> ${esc(m.name)}</label>`).join('')||'<span class="small">In diesem Profil gibt es keine zusätzlichen Wertungen.</span>'}</div></details>`;
      r.querySelector('.ann-del').onclick=()=>{readEditorInto(p);p.announcements.splice(i,1);renderAnnouncementEditor(p.announcements)};
      box.appendChild(r);
    });
  };

  window.readEditorInto=function(p){
    migrateProfile(p);
    const name=document.getElementById('rName').value.trim();if(!name){alert('Profil braucht einen Namen.');return false}
    const players=Math.max(2,Math.min(4,Number(document.getElementById('rPlayers').value)||4));
    const teamSize=Math.max(1,Math.min(players-1,Number(document.getElementById('rTeamSize').value)||1));
    const normalPts=document.getElementById('rNormalPoints').value.split(',').map(x=>Number(x.trim())).filter(x=>Number.isFinite(x)&&x>0);
    if(!normalPts.length){alert('Mindestens einen Wert für normales Spiel eintragen.');return false}
    const oldMods=[...p.modifiers];
    const rows=[...document.querySelectorAll('.v6ModifierRow')];
    p.modifiers=rows.map((row,i)=>({
      id:oldMods[i]?.id||modId(),
      name:row.querySelector('.v6-mod-name').value.trim()||`Wertung ${i+1}`,
      operation:row.querySelector('.v6-mod-op').value,
      value:Number(row.querySelector('.v6-mod-value').value)||0,
      rounding:row.querySelector('.v6-mod-round').value
    }));
    const annRows=[...document.querySelectorAll('.v6Announce')];
    p.announcements=annRows.map(row=>{
      const allowed=[...row.querySelectorAll('.ann-mod:checked')].map(x=>x.value).filter(id=>p.modifiers.some(m=>m.id===id));
      return{name:row.querySelector('.ann-name').value.trim(),points:Number(row.querySelector('.ann-points').value),allowedModifierIds:allowed,fixed:allowed.length===0};
    }).filter(a=>a.name&&Number.isFinite(a.points)&&a.points>=0);
    Object.assign(p,{name,players,teamSize,scoreMode:document.getElementById('rScoreMode').value,limit:Math.max(1,Number(document.getElementById('rLimit').value)||1),bommerl:Math.max(0,Number(document.getElementById('rBommerl').value)||0),normalPoints:[...new Set(normalPts)]});
    return true;
  };

  window.loadRuleEditor=function(){
    const p=editing();if(!p)return;migrateProfile(p);
    document.getElementById('rName').value=p.name;
    document.getElementById('rPlayers').value=p.players;
    document.getElementById('rTeamSize').value=p.teamSize;
    document.getElementById('rScoreMode').value=p.scoreMode;
    document.getElementById('rLimit').value=p.limit;
    document.getElementById('rBommerl').value=p.bommerl;
    document.getElementById('rNormalPoints').value=p.normalPoints.join(',');
    document.getElementById('rLimitLabel').textContent=p.scoreMode==='down'?'Startpunkte':'Punkteziel';
    document.getElementById('saveProfile').disabled=!!(data.started&&p.id===data.activeProfileId);
    renderModifierEditorV6(p);renderAnnouncementEditor(p.announcements);
  };

  ensureEngineUi();
  modifier='base';
  window.initRulesV6=function(){
    ensureEngineUi();
    const add=document.getElementById('addAnnouncement');
    if(add)add.onclick=()=>{const p=editing();readEditorInto(p);p.announcements.push({name:'Neue Ansage',points:1,allowedModifierIds:p.modifiers.map(m=>m.id),fixed:false});renderAnnouncementEditor(p.announcements)};
    loadRuleEditor();renderAll();
  };
})();
