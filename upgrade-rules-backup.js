function loadRuleEditor(){
 const p=editing();if(!p)return;
 document.getElementById("rName").value=p.name;document.getElementById("rPlayers").value=p.players;document.getElementById("rTeamSize").value=p.teamSize;document.getElementById("rScoreMode").value=p.scoreMode;document.getElementById("rLimit").value=p.limit;document.getElementById("rBommerl").value=p.bommerl;document.getElementById("rNormalPoints").value=p.normalPoints.join(",");
 document.getElementById("rHalf").checked=!!p.mods.half;document.getElementById("rFleck").checked=!!p.mods.fleck;document.getElementById("rDouble").checked=!!p.mods.double;document.getElementById("rFleckFactor").value=p.mods.fleckFactor;document.getElementById("rDoubleFactor").value=p.mods.doubleFactor;document.getElementById("rHalfRound").value=p.mods.halfRound||"ceil";
 document.getElementById("rLimitLabel").textContent=p.scoreMode==="down"?"Startpunkte":"Punkteziel";document.getElementById("saveProfile").disabled=!!(data.started&&p.id===data.activeProfileId);
 renderAnnouncementEditor(p.announcements);
}
function renderAnnouncementEditor(arr){
 const box=document.getElementById("announcementEditor");box.innerHTML="";
 if(!arr.length)box.innerHTML='<div class="empty">Keine zusätzlichen Ansagen. „Normal“ ist immer vorhanden.</div>';
 arr.forEach((a,i)=>{const r=document.createElement("div");r.className="announce";r.innerHTML=`<input class="miniInput ann-name" data-i="${i}" maxlength="35" value="${esc(a.name)}"><input class="miniInput ann-points" data-i="${i}" type="number" min="0" step=".5" value="${a.points}"><label class="check lock"><input class="ann-fixed" data-i="${i}" type="checkbox" ${a.fixed?"checked":""}> Fix</label><button class="btn danger ann-del" data-i="${i}">×</button>`;box.appendChild(r)});
}
function readEditorInto(p){
 const name=document.getElementById("rName").value.trim();if(!name){alert("Profil braucht einen Namen.");return false}
 const players=Math.max(2,Math.min(4,Number(document.getElementById("rPlayers").value)||4)),teamSize=Math.max(1,Math.min(players-1,Number(document.getElementById("rTeamSize").value)||1));
 const normalPoints=document.getElementById("rNormalPoints").value.split(",").map(x=>Number(x.trim())).filter(x=>Number.isFinite(x)&&x>0);if(!normalPoints.length){alert("Mindestens einen Wert für normales Spiel eintragen.");return false}
 const anns=[...document.querySelectorAll(".ann-name")].map((el,i)=>({name:el.value.trim(),points:Number(document.querySelectorAll(".ann-points")[i].value),fixed:document.querySelectorAll(".ann-fixed")[i].checked})).filter(a=>a.name&&Number.isFinite(a.points)&&a.points>=0);
 Object.assign(p,{name,players,teamSize,scoreMode:document.getElementById("rScoreMode").value,limit:Math.max(1,Number(document.getElementById("rLimit").value)||1),bommerl:Math.max(0,Number(document.getElementById("rBommerl").value)||0),normalPoints:[...new Set(normalPoints)],mods:{half:document.getElementById("rHalf").checked,fleck:document.getElementById("rFleck").checked,double:document.getElementById("rDouble").checked,fleckFactor:Math.max(1,Number(document.getElementById("rFleckFactor").value)||2),doubleFactor:Math.max(1,Number(document.getElementById("rDoubleFactor").value)||4),halfRound:document.getElementById("rHalfRound").value},announcements:anns});return true;
}
function saveProfile(){
 const p=editing();if(data.started&&p.id===data.activeProfileId){alert("Das aktive Regelprofil ist während eines laufenden Spiels gesperrt. Beende oder ändere zuerst das Spiel.");return}
 if(!readEditorInto(p))return;const active=p.id===data.activeProfileId;if(active){data.active=data.active.slice(0,p.players);data.team1=[];data.started=false;resetBoard()}else save();alert("Regelprofil gespeichert.");renderAll();loadRuleEditor();
}
function newProfile(){const base=clone(profile());base.id=uid();base.name="Neues Regelprofil";data.profiles.push(base);editingProfileId=base.id;save();renderProfiles();loadRuleEditor()}
function duplicateProfile(){const src=editing(),p=clone(src);p.id=uid();p.name=src.name+" Kopie";data.profiles.push(p);editingProfileId=p.id;save();renderProfiles();loadRuleEditor()}
function deleteProfile(){if(data.profiles.length<=1){alert("Mindestens ein Regelprofil muss bleiben.");return}const p=editing();if(data.started&&p.id===data.activeProfileId){alert("Das aktive Regelprofil kann während eines laufenden Spiels nicht gelöscht werden.");return}if(!confirm(`Profil „${p.name}“ löschen?`))return;data.profiles=data.profiles.filter(x=>x.id!==p.id);if(data.activeProfileId===p.id){data.activeProfileId=data.profiles[0].id;resetSelectionForProfile()}editingProfileId=data.profiles[0].id;save();renderAll();loadRuleEditor()}

function downloadText(filename,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function exportBackup(){const payload={format:"schnapsen-tracker-backup",version:5,exportedAt:new Date().toISOString(),data};downloadText(`schnapsen-backup-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(payload,null,2),"application/json")}
function importBackupFile(file){
 const reader=new FileReader();reader.onload=()=>{try{const raw=JSON.parse(reader.result),d=raw.data||raw;if(!d||!Array.isArray(d.players)||!Array.isArray(d.profiles)||!Array.isArray(d.rounds)||!d.profiles.length)throw new Error();if(!confirm("Backup importieren und die aktuellen lokalen Daten ersetzen?"))return;d.players.forEach(p=>{if(typeof p.archived!=="boolean")p.archived=false});d.series=Array.isArray(d.series)?d.series:[];d.ui=d.ui||{};d.ui.historyView=d.ui.historyView||"games";d.started=false;data=d;editingProfileId=data.activeProfileId||data.profiles[0].id;ensureBoard();save();renderAll();loadRuleEditor();alert("Backup importiert.")}catch{alert("Diese Datei ist kein gültiges Schnapsen-Backup.")}};reader.readAsText(file)
}
function csvCell(v){return`"${String(v??"").replaceAll('"','""')}"`}
function exportCsv(){const header=["Datum","Regelprofil","Seite 1","Seite 2","Ansage","Wertung","Punkte","Gewinner","Punktestand vorher","erreichter Stand","Stand danach","Bommerl","Partiesieg"];const rows=data.rounds.slice().reverse().map(r=>[r.at,r.profileName,r.team1.map(pname).join(" + "),r.team2.map(pname).join(" + "),r.type,r.modifier,r.points,r.winner===1?r.team1.map(pname).join(" + "):r.team2.map(pname).join(" + "),scorePair(r.beforeBoard),scorePair(r.reachedBoard||r.afterBoard),scorePair(r.afterBoard),r.bommerlTo||"",r.seriesWinner||""]);downloadText(`schnapsen-verlauf-${new Date().toISOString().slice(0,10)}.csv`,[header,...rows].map(r=>r.map(csvCell).join(";")).join("\n"),"text/csv;charset=utf-8")}
