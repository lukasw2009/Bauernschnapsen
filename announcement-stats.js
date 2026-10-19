/* Persönliche Ansagenstatistik. Berechnet ausschließlich die übergebenen Runden. */
(function (global) {
  'use strict';

  const percentFormat = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 1 });
  const numberFormat = new Intl.NumberFormat('de-AT', { maximumFractionDigits: 2 });
  let cachedArgs = null;
  let selectedType = null;
  const expandedPlayers = new Set();
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
  const idOf = value => value == null || String(value).trim() === '' ? null : String(value);
  const typeOf = round => String(round.type || 'Unbekannt').trim() || 'Unbekannt';
  const percent = (part, whole) => whole > 0 ? part * 100 / whole : 0;
  const pct = value => percentFormat.format(value) + ' %';
  const compareNames = (a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' });
  const isFleckRound = round => ['fleck', 'double'].includes(String(round.modifierId || '')) || /fleck|kontra/i.test(String(round.modifier || ''));
  const isDoubleFleckRound = round => String(round.modifierId || '') === 'double' || /doppel.*fleck|double/i.test(String(round.modifier || ''));

  function newPersonalType(type) {
    return { type, count: 0, wins: 0, outcomes: 0, flecks: 0, doubleFlecks: 0, share: 0, winRate: null };
  }

  function compute(args) {
    args = args || {};
    const sourceRounds = Array.isArray(args.rounds) ? args.rounds : [];
    const rounds = sourceRounds.filter(round => round && typeof round === 'object' &&
      !round.correction && round.type !== 'Korrektur' && round.modifierId !== 'manual_correction');
    const players = Array.isArray(args.players) ? args.players : [];
    const profiles = Array.isArray(args.profiles) ? args.profiles : [];
    const people = new Map();
    const typeMap = new Map();
    const choiceTypes = new Set();
    let knownDeclarerRounds = 0;
    let knownFleckerRounds = 0;
    let fleckRounds = 0;
    let knownDoubleFleckerRounds = 0;
    let totalDoubleFleckRounds = 0;

    function ensurePerson(id) {
      if (!people.has(id)) people.set(id, {
        id, name: 'Nicht mehr vorhandener Spieler', archived: false,
        count: 0, wins: 0, outcomes: 0, flecks: 0, doubleFlecks: 0, types: new Map()
      });
      return people.get(id);
    }
    function ensurePersonalType(person, type) {
      if (!person.types.has(type)) person.types.set(type, newPersonalType(type));
      return person.types.get(type);
    }
    players.forEach(player => {
      if (!player || idOf(player.id) === null) return;
      const person = ensurePerson(idOf(player.id));
      person.name = String(player.name || 'Spieler');
      person.archived = !!player.archived;
    });

    rounds.forEach(round => {
      const type = typeOf(round);
      choiceTypes.add(type);
      if (!typeMap.has(type)) typeMap.set(type, {
        type, count: 0, points: 0, knownDeclarerCount: 0, flecks: 0, doubleFlecks: 0,
        wins: 0, outcomes: 0, share: 0
      });
      const totals = typeMap.get(type);
      totals.count++;
      const points = Number(round.points);
      if (Number.isFinite(points)) totals.points += points;
      const declarerId = idOf(round.declarerId);
      if (declarerId !== null) {
        knownDeclarerRounds++;
        totals.knownDeclarerCount++;
        const person = ensurePerson(declarerId);
        const personalType = ensurePersonalType(person, type);
        person.count++;
        personalType.count++;
        const inFirst = Array.isArray(round.team1) && round.team1.some(id => idOf(id) === declarerId);
        const inSecond = Array.isArray(round.team2) && round.team2.some(id => idOf(id) === declarerId);
        const side = inFirst !== inSecond ? (inFirst ? 1 : 2) : 0;
        const winner = Number(round.winner);
        if (side && (winner === 1 || winner === 2)) {
          person.outcomes++;
          personalType.outcomes++;
          totals.outcomes++;
          if (side === winner) {
            person.wins++;
            personalType.wins++;
            totals.wins++;
          }
        }
      }
      const doubled = isDoubleFleckRound(round);
      const flecked = isFleckRound(round) || doubled;
      if (flecked) fleckRounds++;
      const fleckerId = flecked ? idOf(round.fleckerId) : null;
      if (fleckerId !== null) {
        knownFleckerRounds++;
        totals.flecks++;
        const person = ensurePerson(fleckerId);
        person.flecks++;
        ensurePersonalType(person, type).flecks++;
      }
      if (doubled) {
        totalDoubleFleckRounds++;
        const doubleFleckerId = idOf(round.doubleFleckerId);
        if (doubleFleckerId !== null && doubleFleckerId !== fleckerId) {
          knownDoubleFleckerRounds++;
          totals.doubleFlecks++;
          const person = ensurePerson(doubleFleckerId);
          person.doubleFlecks++;
          ensurePersonalType(person, type).doubleFlecks++;
        }
      }
    });

    const selectedProfile = args.ui && args.ui.statsProfile;
    profiles.filter(profile => profile && (!selectedProfile || selectedProfile === 'all' || String(profile.id) === String(selectedProfile)))
      .forEach(profile => {
        choiceTypes.add('Normal');
        (Array.isArray(profile.announcements) ? profile.announcements : []).forEach(announcement => {
          if (announcement && String(announcement.name || '').trim()) choiceTypes.add(String(announcement.name).trim());
        });
      });
    const types = Array.from(typeMap.values()).map(type => ({
      ...type, share: percent(type.count, rounds.length),
      winRate: type.outcomes ? percent(type.wins, type.outcomes) : null,
      unknownDeclarerCount: type.count - type.knownDeclarerCount
    })).sort((a, b) => b.count - a.count || compareNames(a.type, b.type));
    const personal = Array.from(people.values()).map(person => ({
      ...person,
      winRate: person.outcomes ? percent(person.wins, person.outcomes) : null,
      types: Array.from(person.types.values()).map(type => ({
        ...type, share: percent(type.count, person.count),
        winRate: type.outcomes ? percent(type.wins, type.outcomes) : null
      })).sort((a, b) => b.count - a.count || b.flecks - a.flecks || b.doubleFlecks - a.doubleFlecks || compareNames(a.type, b.type))
    })).sort((a, b) => b.count - a.count || b.flecks - a.flecks || b.doubleFlecks - a.doubleFlecks || compareNames(a.name, b.name));

    const rankingTypes = Array.from(choiceTypes).sort(compareNames);
    const rankings = rankingTypes.map(type => {
      const total = typeMap.get(type);
      const ranked = personal.map(person => {
        const personalType = person.types.find(entry => entry.type === type);
        return personalType && personalType.count ? {
          id: person.id, name: person.name, archived: person.archived,
          count: personalType.count, wins: personalType.wins, outcomes: personalType.outcomes,
          winRate: personalType.winRate, share: percent(personalType.count, total ? total.count : 0)
        } : null;
      }).filter(Boolean).sort((a, b) => b.count - a.count || compareNames(a.name, b.name));
      let rank = 0;
      const rankedPlayers = ranked.map((person, index) => {
        if (!index || person.count !== ranked[index - 1].count) rank = index + 1;
        return { ...person, rank, leader: person.count === ranked[0].count };
      });
      return {
        type, count: total ? total.count : 0,
        knownDeclarerCount: total ? total.knownDeclarerCount : 0,
        wins: total ? total.wins : 0, outcomes: total ? total.outcomes : 0,
        winRate: total && total.outcomes ? percent(total.wins, total.outcomes) : null,
        players: rankedPlayers, leaders: rankedPlayers.filter(person => person.leader)
      };
    });

    return {
      totalRounds: rounds.length,
      knownDeclarerRounds, unknownDeclarerRounds: rounds.length - knownDeclarerRounds,
      knownFleckerRounds, fleckRounds, unknownFleckerRounds: fleckRounds - knownFleckerRounds,
      knownDoubleFleckerRounds, totalDoubleFleckRounds,
      unknownDoubleFleckerRounds: totalDoubleFleckRounds - knownDoubleFleckerRounds,
      coverage: percent(knownDeclarerRounds, rounds.length),
      types, players: personal, rankings
    };
  }

  function coverage(stats) {
    return `<p class="small announcementCoverage">${stats.knownDeclarerRounds} von ${stats.totalRounds} Runden mit Ansager erfasst (${pct(stats.coverage)}). Runden ohne Zuordnung zählen zum Spielanteil; die Siegquote nutzt nur auswertbare Ergebnisse des ausdrücklich erfassten Ansagerteams.${stats.totalDoubleFleckRounds ? ` Doppelflecker: ${stats.knownDoubleFleckerRounds} von ${stats.totalDoubleFleckRounds} erfasst.` : ''}</p>`;
  }

  function typeWinRate(entry) {
    if (entry.winRate === null) return '<strong>Siegquote —</strong><span> · noch kein auswertbares Ergebnis</span>';
    return `<strong>${pct(entry.winRate)} Siegquote</strong><span> · ${entry.wins} / ${entry.outcomes} gewonnen</span>`;
  }

  function distributionRows(stats, compact) {
    if (!stats.totalRounds) return '<p class="small">Noch keine gespielten Runden für diese Filter.</p>';
    return `<div class="announcementDistribution">${stats.types.map(type => `<div class="announcementTypeRow" data-announcement-type="${esc(type.type)}" data-count="${type.count}" data-share="${type.share}" data-wins="${type.wins}" data-outcomes="${type.outcomes}" data-win-rate="${type.winRate === null ? '' : type.winRate}">
      <div class="announcementTypeHead"><strong>${esc(type.type)}</strong></div>
      <div class="announcementWinRate">${typeWinRate(type)}</div>
      <div class="small announcementTypeNumbers">Spielanteil: ${pct(type.share)} · ${type.count} ${type.count === 1 ? 'Runde' : 'Runden'}</div>
      <div class="announcementTypeBar" aria-hidden="true"><span style="width:${Math.min(100, Math.max(0, type.share))}%"></span></div>
      ${compact ? '' : `<div class="small">${numberFormat.format(type.points)} Punkte gesamt · ${type.outcomes} von ${type.count} Ergebnissen auswertbar</div>`}
    </div>`).join('')}</div>`;
  }

  function outcomeText(entry) {
    if (entry.winRate === null) return 'Siegquote —';
    const partial = entry.outcomes !== entry.count ? ` · ${entry.outcomes} auswertbare Ergebnisse` : '';
    return `${entry.wins} / ${entry.outcomes} gewonnen · ${pct(entry.winRate)} Siegquote${partial}`;
  }

  function renderOverview(stats, document) {
    const mount = document.getElementById('announcementOverview');
    if (!mount) return;
    mount.setAttribute('data-total-rounds', String(stats.totalRounds));
    mount.setAttribute('data-known-declarer-rounds', String(stats.knownDeclarerRounds));
    mount.setAttribute('data-known-flecker-rounds', String(stats.knownFleckerRounds));
    mount.setAttribute('data-known-double-flecker-rounds', String(stats.knownDoubleFleckerRounds));
    mount.setAttribute('data-total-double-fleck-rounds', String(stats.totalDoubleFleckRounds));
    mount.innerHTML = `<h2>Wie oft gewinnt welches Spiel?</h2>
      <p class="small announcementIntro">Siegquote der Ansagerteams je Spielart im gewählten Filter. Der Spielanteil zeigt separat, wie häufig die Spielart vorkommt. Korrekturen zählen nicht als Runde.</p>
      <div class="statsMini announcementMetrics"><div class="miniStat"><span>Ansager erfasst</span><strong>${stats.knownDeclarerRounds} / ${stats.totalRounds}</strong></div><div class="miniStat"><span>Erster Flecker erfasst</span><strong>${stats.knownFleckerRounds} / ${stats.fleckRounds}</strong></div><div class="miniStat"><span>Doppelflecker erfasst</span><strong>${stats.knownDoubleFleckerRounds} / ${stats.totalDoubleFleckRounds}</strong></div></div>
      ${distributionRows(stats, true)}${coverage(stats)}`;
  }

  function renderPlayers(stats, document) {
    const mount = document.getElementById('personalAnnouncementStats');
    if (!mount) return;
    mount.querySelectorAll('details[data-declarer-id]').forEach(details => {
      if (details.open) expandedPlayers.add(details.dataset.declarerId);
      else expandedPlayers.delete(details.dataset.declarerId);
    });
    const details = stats.players.map(person => `<details class="announcementPlayer" data-declarer-id="${esc(person.id)}" data-count="${person.count}" data-flecks="${person.flecks}" data-double-flecks="${person.doubleFlecks}" ${expandedPlayers.has(person.id) ? 'open' : ''}>
      <summary class="announcementPlayerSummary"><span><strong>${esc(person.name)}</strong>${person.archived ? '<span class="small"> · archiviert</span>' : ''}<span class="small announcementPlayerMeta">${person.count}× angesagt · ${person.flecks}× Fleck · ${person.doubleFlecks}× Doppelfleck</span></span><span class="announcementPlayerRate">${person.winRate === null ? '—' : pct(person.winRate)}</span></summary>
      <div class="announcementPlayerBody"><p class="small">${outcomeText(person)}. Die Anteile unten beziehen sich auf ${person.count} eigene Ansagen.</p>
      ${person.types.length ? `<div class="announcementBreakdown">${person.types.map(type => `<div class="announcementPersonalType" data-announcement-type="${esc(type.type)}" data-declarer-id="${esc(person.id)}" data-count="${type.count}" data-share="${type.share}" data-flecks="${type.flecks}" data-double-flecks="${type.doubleFlecks}"><div class="announcementTypeHead"><strong>${esc(type.type)}</strong><span>${type.count}× angesagt · ${pct(type.share)} Spielanteil</span></div><div class="small">${outcomeText(type)}${type.flecks ? ` · ${type.flecks}× erster Fleck` : ''}${type.doubleFlecks ? ` · ${type.doubleFlecks}× Doppelfleck` : ''}</div></div>`).join('')}</div>` : '<p class="small">Noch keine Ansagen oder Flecks mit diesem Spieler erfasst.</p>'}
      </div></details>`).join('');
    mount.innerHTML = `<h2>Persönliche Ansagen & Flecks</h2><p class="small announcementIntro">„Angesagt“ zählt die erfasste Spielart pro Runde, einschließlich Normal. Aufklappen zeigt die eigenen Spielanteile und Siege. „Fleck“ zählt den ersten Flecker; „Doppelfleck“ den anderen Spieler, der danach doppelt. Beide zählen nur bei ausdrücklich erfasster Person.</p>${coverage(stats)}${details || '<p class="small">Noch keine Spieler erfasst.</p>'}`;
    mount.querySelectorAll('details[data-declarer-id]').forEach(details => {
      details.addEventListener('toggle', () => {
        if (details.open) expandedPlayers.add(details.dataset.declarerId);
        else expandedPlayers.delete(details.dataset.declarerId);
      });
    });
  }

  function renderLeaders(stats, document, focusSelect) {
    const mount = document.getElementById('announcementLeaders');
    if (!mount) return;
    if (!stats.rankings.some(ranking => ranking.type === selectedType)) {
      selectedType = stats.rankings.find(ranking => compareNames(ranking.type, 'Land') === 0)?.type || stats.rankings[0]?.type || null;
    }
    if (!selectedType) {
      mount.innerHTML = '<h2>Wer sagt am häufigsten an?</h2><p class="small">Noch keine Spielarten erfasst.</p>';
      return;
    }
    const ranking = stats.rankings.find(entry => entry.type === selectedType);
    const maximum = ranking.leaders[0]?.count || 0;
    const leaderNames = ranking.leaders.map(person => esc(person.name)).join(' & ');
    const leaderText = maximum ? `<p class="announcementLeaderHeadline"><strong>${leaderNames}</strong> ${ranking.leaders.length === 1 ? 'führt' : 'liegen gleichauf'} mit ${maximum} ${maximum === 1 ? 'Ansage' : 'Ansagen'}.</p>` : `<p class="small">Für „${esc(selectedType)}“ wurde in diesen Filtern noch kein Ansager erfasst.</p>`;
    mount.innerHTML = `<h2>Wer sagt am häufigsten an?</h2>
      <div class="field announcementLeaderSelect"><label class="label" for="announcementLeaderType">Spielart für die Rangliste</label><select id="announcementLeaderType">${stats.rankings.map(entry => `<option value="${esc(entry.type)}" ${entry.type === selectedType ? 'selected' : ''}>${esc(entry.type)}</option>`).join('')}</select></div>
      <div class="announcementRanking" data-leader-type="${esc(selectedType)}">${leaderText}
      <div class="announcementWinRate">${typeWinRate(ranking)}</div>
      <p class="small">${ranking.knownDeclarerCount} von ${ranking.count} Runden mit Ansager erfasst. Der Spielanteil bezieht sich auf alle ${esc(selectedType)}-Runden im Filter.</p>
      ${ranking.players.map(person => `<div class="announcementRankRow${person.leader ? ' isLeader' : ''}" data-declarer-id="${esc(person.id)}" data-count="${person.count}" data-share="${person.share}" data-rank="${person.rank}" data-leader="${person.leader}"><span class="announcementRank" aria-label="Platz ${person.rank}">${person.rank}.</span><div class="announcementRankMain"><strong>${esc(person.name)}</strong>${person.leader ? `<span class="announcementLeaderBadge">${ranking.leaders.length > 1 ? 'Geteilte Führung' : 'Führung'}</span>` : ''}<span class="small announcementRankMeta">${person.count}× angesagt · ${pct(person.share)} Spielanteil<br>${outcomeText(person)}</span></div></div>`).join('')}</div>`;
    const select = document.getElementById('announcementLeaderType');
    select.addEventListener('change', () => {
      selectedType = select.value;
      if (cachedArgs) render(cachedArgs, true);
    });
    if (focusSelect) select.focus({ preventScroll: true });
  }

  function render(args, focusSelect) {
    cachedArgs = args || {};
    const stats = compute(cachedArgs);
    const document = global.document;
    if (!document) return stats;
    renderOverview(stats, document);
    renderPlayers(stats, document);
    const typeMount = document.getElementById('typeStats');
    if (typeMount) typeMount.innerHTML = `<p class="small announcementIntro">Siegquote = gewonnene Runden des erfassten Ansagerteams / auswertbare Ergebnisse. Spielanteil = Häufigkeit unter ${stats.totalRounds} gespielten Runden. Alle Angaben folgen den Statistikfiltern.</p>${distributionRows(stats, false)}`;
    renderLeaders(stats, document, focusSelect);
    return stats;
  }

  global.AnnouncementStats = { compute, render };
})(window);
