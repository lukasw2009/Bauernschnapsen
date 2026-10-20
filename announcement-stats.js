/* Personen, Rollen und tatsächliche Rundenpunkte; keine Änderung an Spiel- oder Speicherdaten. */
(function (global) {
  'use strict';
  const percentFormat = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1 });
  const numberFormat = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 3 });
  const roleKeys = ['declarations', 'flecks', 'doubleFlecks', 'halves'];
  const roleLabels = { declarations: 'Ansagen', flecks: 'Erster Fleck', doubleFlecks: 'Doppelfleck', halves: 'Halbiert' };
  const metricLabels = { ...roleLabels, pointsWon: 'Pluspunkte', pointsLost: 'Minuspunkte', net: 'Punktesaldo' };
  let cachedArgs = null, cachedStats = null, selectedType = null, selectedMetric = 'declarations';
  let currentPlayerId = null, dialogOpener = null, delegatedDocument = null;
  const expandedPlayers = new Set();
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const idOf = value => value == null || String(value).trim() === '' ? null : String(value);
  const typeOf = round => String(round.type || 'Unbekannt').trim() || 'Unbekannt';
  const percent = (part, whole) => whole > 0 ? part * 100 / whole : 0;
  const pct = value => percentFormat.format(value) + ' %';
  const num = value => numberFormat.format(value);
  const signed = value => value > 0 ? '+' + num(value) : value < 0 ? '−' + num(-value) : '0';
  const compareNames = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' });
  const isDoubleFleckRound = round => String(round.modifierId || '') === 'double' || /doppel.*fleck|double/i.test(String(round.modifier || ''));
  const isFleckRound = round => isDoubleFleckRound(round) || String(round.modifierId || '') === 'fleck' || /fleck|kontra/i.test(String(round.modifier || ''));
  const isHalfRound = round => String(round.modifierId || '') === 'half' || /halb|half/i.test(String(round.modifier || ''));
  function declarationApplies(round) {
    const modifierId = String(round.modifierId || '');
    const modifier = String(round.modifier || '').trim();
    const plainNormal = compareNames(typeOf(round), 'Normal') === 0 &&
      !isFleckRound(round) && !isHalfRound(round) &&
      (modifierId === 'base' || (!modifierId && (!modifier || /^normal$/i.test(modifier))));
    return !plainNormal && round.declarationApplicable !== false;
  }
  function sideOf(round, playerId) {
    const first = Array.isArray(round.team1) && round.team1.some(id => idOf(id) === playerId);
    const second = Array.isArray(round.team2) && round.team2.some(id => idOf(id) === playerId);
    return first !== second ? (first ? 1 : 2) : 0;
  }
  function newOutcome() {
    return { count: 0, wins: 0, losses: 0, outcomes: 0, pointsWon: 0, pointsLost: 0 };
  }
  function newRoles() { return Object.fromEntries(roleKeys.map(key => [key, newOutcome()])); }
  function finishOutcome(outcome) {
    return { ...outcome, net: outcome.pointsWon - outcome.pointsLost,
      winRate: outcome.outcomes ? percent(outcome.wins, outcome.outcomes) : null };
  }
  function addRole(outcome, side, winner, points) {
    outcome.count++;
    if (!side || (winner !== 1 && winner !== 2)) return;
    outcome.outcomes++;
    if (side === winner) { outcome.wins++; outcome.pointsWon += points; }
    else { outcome.losses++; outcome.pointsLost += points; }
  }
  function newParticipant() {
    return { participations: 0, roundWins: 0, roundLosses: 0, teamOutcomes: 0,
      pointsWon: 0, pointsLost: 0, roles: newRoles() };
  }
  function addParticipation(entry, side, winner, points) {
    entry.participations++;
    if (!side || (winner !== 1 && winner !== 2)) return;
    entry.teamOutcomes++;
    if (side === winner) { entry.roundWins++; entry.pointsWon += points; }
    else { entry.roundLosses++; entry.pointsLost += points; }
  }
  function finishParticipant(entry, ownDeclarations) {
    const roles = Object.fromEntries(roleKeys.map(key => [key, finishOutcome(entry.roles[key])]));
    const declarations = roles.declarations;
    return { ...entry, roles, count: declarations.count, wins: declarations.wins,
      losses: declarations.losses, outcomes: declarations.outcomes, winRate: declarations.winRate,
      flecks: roles.flecks.count, doubleFlecks: roles.doubleFlecks.count, halves: roles.halves.count,
      net: entry.pointsWon - entry.pointsLost,
      teamWinRate: entry.teamOutcomes ? percent(entry.roundWins, entry.teamOutcomes) : null,
      declaredPointsWon: declarations.pointsWon, declaredPointsLost: declarations.pointsLost,
      declaredNet: declarations.net, share: percent(declarations.count, ownDeclarations)
    };
  }
  function rankMetric(metric, people, total, byType) {
    const isRole = roleKeys.includes(metric);
    const denominator = { declarations: total.declarationRounds, flecks: total.fleckRounds,
      doubleFlecks: total.totalDoubleFleckRounds, halves: total.totalHalfRounds }[metric] || 0;
    const entries = people.map(person => {
      const source = byType ? person.types.find(entry => entry.type === byType) : person;
      if (!source) return null;
      const result = isRole ? source.roles[metric] : {
        count: source.participations, wins: source.roundWins, losses: source.roundLosses,
        outcomes: source.teamOutcomes, winRate: source.teamWinRate,
        pointsWon: source.pointsWon, pointsLost: source.pointsLost, net: source.net
      };
      if (isRole ? !result.count : !source.teamOutcomes) return null;
      return { id: person.id, name: person.name, archived: person.archived,
        ...result, participations: source.participations, metric,
        value: isRole ? result.count : result[metric],
        share: isRole ? percent(result.count, denominator) : null };
    }).filter(Boolean).sort((a, b) => Math.abs(b.value - a.value) > 1e-9 ? b.value - a.value : compareNames(a.name, b.name));
    let rank = 0;
    const players = entries.map((entry, index) => {
      if (!index || Math.abs(entry.value - entries[index - 1].value) > 1e-9) rank = index + 1;
      return { ...entry, rank, leader: Math.abs(entry.value - entries[0].value) < 1e-9 };
    });
    return { metric, denominator, players, leaders: players.filter(player => player.leader) };
  }
  function buildRanking(type, people, total) {
    const metrics = Object.fromEntries(Object.keys(metricLabels).map(metric => [metric, rankMetric(metric, people, total, type === '__all__' ? null : type)]));
    return { ...total, type, metrics, players: metrics.declarations.players, leaders: metrics.declarations.leaders };
  }

  function compute(args) {
    args = args || {};
    const rounds = (Array.isArray(args.rounds) ? args.rounds : []).filter(round => round && typeof round === 'object' &&
      !round.correction && round.type !== 'Korrektur' && round.modifierId !== 'manual_correction');
    const players = Array.isArray(args.players) ? args.players : [];
    const profiles = Array.isArray(args.profiles) ? args.profiles : [];
    const people = new Map(), typeMap = new Map(), choiceTypes = new Set();
    const overall = { count: rounds.length, points: 0, declarationRounds: 0, plainNormalRounds: 0,
      fleckRounds: 0, totalDoubleFleckRounds: 0, totalHalfRounds: 0, roles: newRoles() };
    function ensurePerson(id) {
      if (!people.has(id)) people.set(id, { id, name: 'Nicht mehr vorhandener Spieler', archived: false,
        ...newParticipant(), types: new Map() });
      return people.get(id);
    }
    function ensurePersonalType(person, type) {
      if (!person.types.has(type)) person.types.set(type, { type, ...newParticipant() });
      return person.types.get(type);
    }
    players.forEach(player => {
      if (!player || idOf(player.id) === null) return;
      const person = ensurePerson(idOf(player.id));
      person.name = String(player.name || 'Spieler'); person.archived = !!player.archived;
    });
    rounds.forEach(round => {
      const type = typeOf(round), winner = Number(round.winner);
      // r.points ist bereits die tatsächliche Wertung einschließlich Modifier und Rundung.
      const value = Number(round.points), points = Number.isFinite(value) && value >= 0 ? value : 0;
      choiceTypes.add(type);
      if (!typeMap.has(type)) typeMap.set(type, { type, count: 0, points: 0,
        declarationRounds: 0, plainNormalRounds: 0, fleckRounds: 0,
        totalDoubleFleckRounds: 0, totalHalfRounds: 0, roles: newRoles() });
      const totals = typeMap.get(type);
      totals.count++; totals.points += points; overall.points += points;
      const participantIds = new Set([...(Array.isArray(round.team1) ? round.team1 : []),
        ...(Array.isArray(round.team2) ? round.team2 : [])].map(idOf).filter(id => id !== null));
      participantIds.forEach(id => {
        const person = ensurePerson(id), personalType = ensurePersonalType(person, type), side = sideOf(round, id);
        addParticipation(person, side, winner, points); addParticipation(personalType, side, winner, points);
      });
      const applies = declarationApplies(round), flecked = isFleckRound(round), doubled = isDoubleFleckRound(round), halved = isHalfRound(round);
      if (applies) { totals.declarationRounds++; overall.declarationRounds++; }
      else { totals.plainNormalRounds++; overall.plainNormalRounds++; }
      if (flecked) { totals.fleckRounds++; overall.fleckRounds++; }
      if (doubled) { totals.totalDoubleFleckRounds++; overall.totalDoubleFleckRounds++; }
      if (halved) { totals.totalHalfRounds++; overall.totalHalfRounds++; }
      const declarerId = applies ? idOf(round.declarerId) : null;
      const distinctActors = Number(round.roleModelVersion) >= 2;
      const initialId = flecked ? idOf(round.fleckerId) : null;
      const fleckerId = distinctActors && initialId === declarerId ? null : initialId;
      const doubleId = doubled ? idOf(round.doubleFleckerId) : null;
      const actors = {
        declarations: declarerId,
        flecks: fleckerId,
        doubleFlecks: doubleId !== fleckerId && (!distinctActors || doubleId !== declarerId) ? doubleId : null,
        halves: halved ? idOf(round.halverId) : null
      };
      roleKeys.forEach(role => {
        const id = actors[role]; if (id === null) return;
        const person = ensurePerson(id), personalType = ensurePersonalType(person, type), side = sideOf(round, id);
        addRole(person.roles[role], side, winner, points); addRole(personalType.roles[role], side, winner, points);
        addRole(totals.roles[role], side, winner, points); addRole(overall.roles[role], side, winner, points);
      });
    });
    function finishTotals(entry) {
      const roles = Object.fromEntries(roleKeys.map(key => [key, finishOutcome(entry.roles[key])]));
      const declared = roles.declarations;
      return { ...entry, roles, wins: declared.wins, losses: declared.losses,
        outcomes: declared.outcomes, winRate: declared.winRate,
        pointsWon: declared.pointsWon, pointsLost: declared.pointsLost, net: declared.net,
        knownDeclarerCount: declared.count, unknownDeclarerCount: entry.declarationRounds - declared.count,
        flecks: roles.flecks.count, doubleFlecks: roles.doubleFlecks.count, halves: roles.halves.count,
        share: percent(entry.count, rounds.length) };
    }
    const types = Array.from(typeMap.values(), finishTotals).sort((a, b) => b.count - a.count || compareNames(a.type, b.type));
    const personal = Array.from(people.values()).map(person => {
      const result = finishParticipant(person, person.roles.declarations.count);
      result.types = Array.from(person.types.values(), type => finishParticipant(type, result.count))
        .sort((a, b) => b.participations - a.participations || b.count - a.count || compareNames(a.type, b.type));
      return result;
    }).sort((a, b) => b.count - a.count || b.participations - a.participations || compareNames(a.name, b.name));
    const selectedProfile = args.ui && args.ui.statsProfile;
    profiles.filter(profile => profile && (!selectedProfile || selectedProfile === 'all' || String(profile.id) === String(selectedProfile))).forEach(profile => {
      choiceTypes.add('Normal');
      (Array.isArray(profile.announcements) ? profile.announcements : []).forEach(announcement => {
        if (announcement && String(announcement.name || '').trim()) choiceTypes.add(String(announcement.name).trim());
      });
    });
    const emptyTotals = () => finishTotals({ count: 0, points: 0, declarationRounds: 0, plainNormalRounds: 0,
      fleckRounds: 0, totalDoubleFleckRounds: 0, totalHalfRounds: 0, roles: newRoles() });
    const rankings = Array.from(choiceTypes).sort(compareNames).map(type =>
      buildRanking(type, personal, types.find(entry => entry.type === type) || emptyTotals()));
    const finishedOverall = finishTotals(overall);
    const knownDeclarerRounds = finishedOverall.roles.declarations.count;
    return {
      totalRounds: rounds.length, declarationRounds: overall.declarationRounds, plainNormalRounds: overall.plainNormalRounds,
      knownDeclarerRounds, unknownDeclarerRounds: overall.declarationRounds - knownDeclarerRounds,
      knownFleckerRounds: finishedOverall.roles.flecks.count, fleckRounds: overall.fleckRounds,
      unknownFleckerRounds: overall.fleckRounds - finishedOverall.roles.flecks.count,
      knownDoubleFleckerRounds: finishedOverall.roles.doubleFlecks.count, totalDoubleFleckRounds: overall.totalDoubleFleckRounds,
      unknownDoubleFleckerRounds: overall.totalDoubleFleckRounds - finishedOverall.roles.doubleFlecks.count,
      knownHalverRounds: finishedOverall.roles.halves.count, totalHalfRounds: overall.totalHalfRounds,
      unknownHalverRounds: overall.totalHalfRounds - finishedOverall.roles.halves.count,
      coverage: percent(knownDeclarerRounds, overall.declarationRounds), roles: finishedOverall.roles,
      types, players: personal, rankings, overallRanking: buildRanking('__all__', personal, finishedOverall)
    };
  }

  function nameButton(person) {
    return `<button type="button" class="playerStatsName" data-open-player-stats="${esc(person.id)}" aria-label="Statistik von ${esc(person.name)} öffnen">${esc(person.name)}</button>`;
  }
  function pointLine(entry) {
    return `<span class="playerStatsPointLine">+${num(entry.pointsWon)} / −${num(entry.pointsLost)} Punkte · Saldo ${signed(entry.net)}</span>`;
  }
  function coverage(stats) {
    return `<p class="small announcementCoverage">${stats.knownDeclarerRounds} von ${stats.declarationRounds} Ansagen mit Person erfasst (${pct(stats.coverage)}). ${stats.plainNormalRounds} normale Runden ohne Ansage benötigen keine Zuordnung. Unbekannte Rollen werden nicht geraten; Siegquoten nutzen nur auswertbare Ergebnisse der jeweils erfassten Person.</p>`;
  }
  function typeWinRate(entry) {
    if (entry.winRate === null) return '<strong>Siegquote —</strong><span> · noch kein auswertbares Ansagerergebnis</span>';
    return `<strong>${pct(entry.winRate)} Siegquote</strong><span> · ${entry.wins} / ${entry.outcomes} gewonnen</span>`;
  }
  function outcomeText(entry) {
    if (entry.winRate === null) return 'Siegquote —';
    return `${entry.wins} / ${entry.outcomes} gewonnen · ${pct(entry.winRate)} Siegquote${entry.outcomes !== entry.count ? ` · ${entry.outcomes} auswertbare Ergebnisse` : ''}`;
  }
  function distributionRows(stats, compact) {
    if (!stats.totalRounds) return '<p class="small">Noch keine gespielten Runden für diese Filter.</p>';
    return `<div class="announcementDistribution">${stats.types.map(type => `<div class="announcementTypeRow" data-announcement-type="${esc(type.type)}" data-count="${type.count}" data-share="${type.share}" data-wins="${type.wins}" data-outcomes="${type.outcomes}" data-win-rate="${type.winRate === null ? '' : type.winRate}" data-points-won="${type.pointsWon}" data-points-lost="${type.pointsLost}" data-net="${type.net}">
      <div class="announcementTypeHead"><strong>${esc(type.type)}</strong></div><div class="announcementWinRate">${typeWinRate(type)}</div>
      <div class="small">Ansagerpunkte: ${pointLine(type)}</div>
      <div class="small announcementTypeNumbers">Spielanteil: ${pct(type.share)} · ${type.count} ${type.count === 1 ? 'Runde' : 'Runden'}</div>
      <div class="announcementTypeBar" aria-hidden="true"><span style="width:${Math.min(100, Math.max(0, type.share))}%"></span></div>
      ${compact ? '' : `<div class="small">${num(type.points)} tatsächliche Rundenpunkte gesamt · ${type.outcomes} auswertbare Ansagerergebnisse</div>`}</div>`).join('')}</div>`;
  }
  function renderOverview(stats, document) {
    const mount = document.getElementById('announcementOverview'); if (!mount) return;
    const attributes = { 'total-rounds': stats.totalRounds, 'declaration-rounds': stats.declarationRounds,
      'known-declarer-rounds': stats.knownDeclarerRounds, 'known-flecker-rounds': stats.knownFleckerRounds,
      'known-double-flecker-rounds': stats.knownDoubleFleckerRounds, 'total-double-fleck-rounds': stats.totalDoubleFleckRounds,
      'known-halver-rounds': stats.knownHalverRounds, 'total-half-rounds': stats.totalHalfRounds };
    Object.entries(attributes).forEach(([key, value]) => mount.setAttribute('data-' + key, String(value)));
    mount.innerHTML = `<h2>Ergebnisse aller Spielarten</h2><p class="small announcementIntro">Siegquote und Plus-/Minuspunkte des Ansagerteams, daneben die Häufigkeit. Die gespeicherte Rundenwertung enthält bereits Fleck, Doppelfleck, Halbierung und Rundung.</p>
      <div class="statsMini announcementMetrics"><div class="miniStat"><span>Ansager erfasst</span><strong>${stats.knownDeclarerRounds} / ${stats.declarationRounds}</strong></div><div class="miniStat"><span>Erster Flecker</span><strong>${stats.knownFleckerRounds} / ${stats.fleckRounds}</strong></div><div class="miniStat"><span>Doppelflecker</span><strong>${stats.knownDoubleFleckerRounds} / ${stats.totalDoubleFleckRounds}</strong></div><div class="miniStat"><span>Halbierer</span><strong>${stats.knownHalverRounds} / ${stats.totalHalfRounds}</strong></div></div>
      ${distributionRows(stats, true)}${coverage(stats)}`;
  }
  function personalAttributes(person) {
    return `data-count="${person.count}" data-flecks="${person.flecks}" data-double-flecks="${person.doubleFlecks}" data-halves="${person.halves}" data-participations="${person.participations}" data-points-won="${person.pointsWon}" data-points-lost="${person.pointsLost}" data-net="${person.net}"`;
  }
  function renderPlayers(stats, document) {
    const mount = document.getElementById('personalAnnouncementStats'); if (!mount) return;
    mount.querySelectorAll('details[data-declarer-id]').forEach(details => {
      if (details.open) expandedPlayers.add(details.dataset.declarerId); else expandedPlayers.delete(details.dataset.declarerId);
    });
    const details = stats.players.map(person => `<details class="announcementPlayer" data-declarer-id="${esc(person.id)}" ${personalAttributes(person)} ${expandedPlayers.has(person.id) ? 'open' : ''}>
      <summary class="announcementPlayerSummary"><span>${nameButton(person)}${person.archived ? '<span class="small"> · archiviert</span>' : ''}<span class="small announcementPlayerMeta">${person.count}× Ansage · ${person.flecks}× Fleck · ${person.doubleFlecks}× Doppelfleck · ${person.halves}× halbiert</span></span><span class="announcementPlayerRate">${signed(person.net)}</span></summary>
      <div class="announcementPlayerBody"><p class="small">Team-Rundenpunkte: ${pointLine(person)}<br>Eigene Ansagen: ${outcomeText(person.roles.declarations)} · ${pointLine(person.roles.declarations)}</p>
      ${person.types.length ? `<div class="announcementBreakdown">${person.types.map(type => `<div class="announcementPersonalType" data-announcement-type="${esc(type.type)}" data-declarer-id="${esc(person.id)}" ${personalAttributes(type)}><div class="announcementTypeHead"><strong>${esc(type.type)}</strong><span>${type.participations} Runden</span></div><div class="small">Team-Rundenpunkte: ${pointLine(type)}<br>Eigene Ansagen: ${outcomeText(type.roles.declarations)} · ${pointLine(type.roles.declarations)}<br>${type.flecks}× Fleck · ${type.doubleFlecks}× Doppelfleck · ${type.halves}× halbiert</div></div>`).join('')}</div>` : '<p class="small">Noch keine Runden oder erfassten Rollen.</p>'}
      </div></details>`).join('');
    mount.innerHTML = `<h2>Persönliche Punkte & Rollen</h2><p class="small announcementIntro">Namen antippen öffnet das Spielerprofil. Team-Rundenpunkte zählen jede gespielte Runde einmal pro Teilnehmer; Rollenpunkte sind Teilmengen derselben Runden. Partner erhalten dasselbe Team-Ergebnis.</p>${coverage(stats)}${details || '<p class="small">Noch keine Spieler erfasst.</p>'}`;
  }
  function metricValue(entry, metric) {
    if (roleKeys.includes(metric)) return `${entry.value}×`;
    return metric === 'net' ? signed(entry.value) : (metric === 'pointsWon' ? '+' : '−') + num(entry.value);
  }
  function renderLeaders(stats, document, focusSelect) {
    const mount = document.getElementById('announcementLeaders'); if (!mount) return;
    if (selectedType !== '__all__' && !stats.rankings.some(ranking => ranking.type === selectedType)) {
      selectedType = stats.rankings.find(ranking => compareNames(ranking.type, 'Land') === 0)?.type || stats.rankings[0]?.type || '__all__';
    }
    const ranking = selectedType === '__all__' ? stats.overallRanking : stats.rankings.find(entry => entry.type === selectedType);
    const result = ranking.metrics[selectedMetric];
    const roleMetric = roleKeys.includes(selectedMetric);
    const names = result.leaders.map(nameButton).join(' & ');
    const leading = result.leaders.length ? `<p class="announcementLeaderHeadline">${names} ${result.leaders.length > 1 ? 'liegen gleichauf' : 'führt'}: <strong>${metricValue(result.leaders[0], selectedMetric)}</strong> ${esc(metricLabels[selectedMetric])}.</p>` : '<p class="small">Für diese Auswahl sind noch keine auswertbaren Einträge erfasst.</p>';
    mount.innerHTML = `<h2>Ranglisten für Punkte & Rollen</h2><div class="announcementLeaderControls"><div class="field announcementLeaderSelect"><label class="label" for="announcementLeaderType">Spielart</label><select id="announcementLeaderType"><option value="__all__" ${selectedType === '__all__' ? 'selected' : ''}>Alle Spielarten</option>${stats.rankings.map(entry => `<option value="${esc(entry.type)}" ${entry.type === selectedType ? 'selected' : ''}>${esc(entry.type)}</option>`).join('')}</select></div><div class="field announcementLeaderSelect"><label class="label" for="announcementLeaderMetric">Rangliste nach</label><select id="announcementLeaderMetric">${Object.entries(metricLabels).map(([key, label]) => `<option value="${key}" ${selectedMetric === key ? 'selected' : ''}>${label}</option>`).join('')}</select></div></div>
      <div class="announcementRanking" data-leader-type="${esc(selectedType)}" data-leader-metric="${selectedMetric}">${leading}
      <p class="small">${roleMetric ? 'Siegquote und Punkte gelten für die jeweils ausgewählte Rolle.' : 'Team-Rundenpunkte pro Teilnehmer; Spielpartner erhalten dasselbe Team-Ergebnis.'} Gleichstände teilen sich denselben Rang.</p>
      ${result.players.map(person => `<div class="announcementRankRow${person.leader ? ' isLeader' : ''}" data-declarer-id="${esc(person.id)}" data-count="${person.count}" data-share="${person.share === null ? '' : person.share}" data-rank="${person.rank}" data-leader="${person.leader}" data-value="${person.value}" data-points-won="${person.pointsWon}" data-points-lost="${person.pointsLost}" data-net="${person.net}"><span class="announcementRank" aria-label="Platz ${person.rank}">${person.rank}.</span><div class="announcementRankMain">${nameButton(person)}${person.leader ? `<span class="announcementLeaderBadge">${result.leaders.length > 1 ? 'Geteilter Rang 1' : 'Rang 1'}</span>` : ''}<span class="small announcementRankMeta"><strong>${metricValue(person, selectedMetric)} ${esc(metricLabels[selectedMetric])}</strong>${person.share === null ? '' : ` · ${pct(person.share)} der passenden Runden`}<br>${outcomeText(person)}<br>${pointLine(person)}</span></div></div>`).join('')}</div>`;
    ['announcementLeaderType', 'announcementLeaderMetric'].forEach(id => {
      const select = document.getElementById(id);
      select.addEventListener('change', () => {
        if (id === 'announcementLeaderType') selectedType = select.value; else selectedMetric = select.value;
        if (cachedArgs) render(cachedArgs, id);
      });
    });
    if (focusSelect) document.getElementById(typeof focusSelect === 'string' ? focusSelect : 'announcementLeaderType')?.focus({ preventScroll: true });
  }
  function roleCards(entry) {
    return `<div class="playerStatsRoleGrid">${roleKeys.map(role => {
      const outcome = entry.roles[role];
      return `<div class="playerStatsRole" data-role-key="${role}" data-count="${outcome.count}" data-wins="${outcome.wins}" data-outcomes="${outcome.outcomes}" data-points-won="${outcome.pointsWon}" data-points-lost="${outcome.pointsLost}" data-net="${outcome.net}"><strong>${esc(roleLabels[role])}: ${outcome.count}×</strong><span class="small">${outcomeText(outcome)}<br>${pointLine(outcome)}</span></div>`;
    }).join('')}</div>`;
  }
  function fillPlayerDialog(dialog, person) {
    const attributes = { 'player-id': person.id, 'participations': person.participations,
      'points-won': person.pointsWon, 'points-lost': person.pointsLost, net: person.net,
      declarations: person.count, flecks: person.flecks, 'double-flecks': person.doubleFlecks, halves: person.halves };
    Object.entries(attributes).forEach(([key, value]) => dialog.setAttribute('data-' + key, String(value)));
    dialog.innerHTML = `<div class="playerStatsDialogHead"><div><span class="small">Spielerprofil</span><h2 id="playerStatsDialogTitle">${esc(person.name)}</h2></div><button type="button" class="iconBtn playerStatsDialogClose" data-close-player-stats aria-label="Spielerprofil schließen">×</button></div>
      <div class="playerStatsDialogBody"><p class="small">Alle Angaben folgen den aktuellen Statistikfiltern. Punkte verwenden die tatsächlich gespeicherte Rundenwertung einschließlich Fleck, Doppelfleck und Halbierung.</p>
      <h3>Team-Rundenpunkte · alle Spielarten</h3><div class="playerStatsTotals"><div class="playerStatsMetric"><span>Runden</span><strong>${person.participations}</strong></div><div class="playerStatsMetric"><span>Gewonnen / verloren</span><strong>${person.roundWins} / ${person.roundLosses}</strong></div><div class="playerStatsMetric"><span>Pluspunkte</span><strong>+${num(person.pointsWon)}</strong></div><div class="playerStatsMetric"><span>Minuspunkte</span><strong>−${num(person.pointsLost)}</strong></div><div class="playerStatsMetric"><span>Saldo</span><strong>${signed(person.net)}</strong></div><div class="playerStatsMetric"><span>Team-Siegquote</span><strong>${person.teamWinRate === null ? '—' : pct(person.teamWinRate)}</strong></div></div>
      <p class="small">Jeder Partner erhält dasselbe Team-Ergebnis. Rollenpunkte unten sind Teilmengen und werden nicht zusätzlich zu diesen Team-Rundenpunkten addiert.</p><h3>Ergebnisse je eigener Rolle</h3>${roleCards(person)}
      <h3>Alle Spielarten einzeln</h3>${person.types.map(type => `<details class="playerStatsType" data-player-type="${esc(type.type)}" ${personalAttributes(type)}><summary><strong>${esc(type.type)}</strong><span>${type.participations} Runden · Saldo ${signed(type.net)}</span></summary><div class="playerStatsTypeBody"><p class="small">Team: ${type.roundWins} gewonnen / ${type.roundLosses} verloren · ${type.teamWinRate === null ? 'Siegquote —' : pct(type.teamWinRate) + ' Siegquote'}<br>${pointLine(type)}</p>${roleCards(type)}</div></details>`).join('') || '<p class="small">Noch keine Runden oder zugeordneten Rollen für diesen Spieler.</p>'}</div>`;
  }
  function restoreDialogFocus(document) {
    currentPlayerId = null;
    const target = dialogOpener && dialogOpener.isConnected && dialogOpener !== document.body ? dialogOpener : document.querySelector?.('.nav .tab.active');
    target?.focus?.({ preventScroll: true }); dialogOpener = null;
  }
  function ensurePlayerDialog(document) {
    let dialog = document.getElementById('playerStatsDialog'); if (dialog) return dialog;
    dialog = document.createElement('dialog'); dialog.id = 'playerStatsDialog'; dialog.className = 'playerStatsDialog';
    dialog.setAttribute('aria-labelledby', 'playerStatsDialogTitle');
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    dialog.addEventListener('close', () => restoreDialogFocus(document));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    document.body.appendChild(dialog); return dialog;
  }
  function openPlayer(id) {
    const document = global.document;
    if (!document || !cachedStats) return false;
    const person = cachedStats.players.find(entry => entry.id === idOf(id)); if (!person) return false;
    bindDelegation(document);
    const dialog = ensurePlayerDialog(document);
    if (!dialog.open) dialogOpener = document.activeElement;
    currentPlayerId = person.id; fillPlayerDialog(dialog, person);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-close-player-stats]')?.focus({ preventScroll: true }); return true;
  }
  function bindDelegation(document) {
    if (delegatedDocument === document || typeof document.addEventListener !== 'function') return;
    delegatedDocument = document;
    document.addEventListener('click', event => {
      const close = event.target.closest?.('[data-close-player-stats]');
      if (close) { document.getElementById('playerStatsDialog')?.close(); return; }
      const button = event.target.closest?.('[data-open-player-stats]'); if (!button) return;
      event.preventDefault(); event.stopPropagation(); openPlayer(button.getAttribute('data-open-player-stats'));
    });
  }
  function render(args, focusSelect) {
    cachedArgs = args || {}; cachedStats = compute(cachedArgs);
    const document = global.document; if (!document) return cachedStats;
    bindDelegation(document); renderOverview(cachedStats, document); renderPlayers(cachedStats, document);
    const typeMount = document.getElementById('typeStats');
    if (typeMount) typeMount.innerHTML = `<p class="small announcementIntro">Siegquote und Punkte des ausdrücklich erfassten Ansagerteams. Spielanteil zeigt die Häufigkeit unter ${cachedStats.totalRounds} gespielten Runden. Normales Grundspiel benötigt keinen Ansager.</p>${distributionRows(cachedStats, false)}`;
    renderLeaders(cachedStats, document, focusSelect);
    if (currentPlayerId) {
      const dialog = document.getElementById('playerStatsDialog'), person = cachedStats.players.find(entry => entry.id === currentPlayerId);
      if (dialog?.open && person) fillPlayerDialog(dialog, person);
      else if (dialog?.open) dialog.close();
    }
    return cachedStats;
  }
  global.AnnouncementStats = { compute, render, openPlayer };
})(window);
