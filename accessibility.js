/* Ergänzt Beschriftungen und Tastaturbedienung, ohne Spiel- oder Speicherdaten zu ändern. */
(function () {
  'use strict';

  const byId = id => document.getElementById(id);
  const dialog = byId('gameActions');
  const focusSelector = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]';
  const backgroundState = new Map();
  let modalWasOpen = false;
  let returnFocus = null;
  let pending = false;
  let replacedControl = null;

  function attribute(element, name, value) {
    if (!element) return;
    if (value === null) {
      if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (element.getAttribute(name) !== String(value)) {
      element.setAttribute(name, String(value));
    }
  }

  function visible(element) {
    return !!element && element.isConnected && !element.disabled &&
      !element.closest('.hidden, [hidden], [inert]') && element.getClientRects().length > 0;
  }

  function labelFields() {
    const names = {
      quickProfile: 'Regelprofil', setupNewPlayer: 'Neuen Spieler für die Partie hinzufügen',
      roundDeclarer: 'Wer sagt an oder spielt?', roundFlecker: 'Wer fleckt?', roundDoubleFlecker: 'Wer doppelfleckt?',
      newPlayer: 'Name des neuen Spielers', startDealer: 'Erster Geber',
      historyProfile: 'Regelprofil im Verlauf', historyPlayer: 'Spieler im Verlauf',
      historyType: 'Ansage im Verlauf', historySort: 'Verlauf sortieren', historyView: 'Verlauf anzeigen',
      statsProfile: 'Regelprofil für die Statistik', statsPeriod: 'Zeitraum für die Statistik',
      statsSort: 'Spielerstatistik sortieren', statsScope: 'Daten für die Statistik',
      profileSelect: 'Regelprofil bearbeiten', rName: 'Name des Regelprofils',
      rPlayers: 'Spieler insgesamt', rTeamSize: 'Spieler auf Seite 1', rScoreMode: 'Zählweise',
      rLimit: 'Startpunkte oder Punkteziel', rBommerl: 'Bommerl bis zum Partieende',
      rNormalPoints: 'Punkte für normale Spiele, durch Komma getrennt',
      backupFile: 'Schnapsen-Backup auswählen'
    };
    Object.entries(names).forEach(([id, name]) => {
      const input = byId(id);
      if (!input) return;
      const field = input.closest('.field') || (id === 'quickProfile' ? input.parentElement : null);
      const label = field && field.querySelector('.label');
      if (label) {
        if (!label.id) label.id = 'label-' + id;
        attribute(input, 'aria-labelledby', label.id);
      } else {
        attribute(input, 'aria-label', name);
      }
    });
    ['setupNewPlayer', 'newPlayer'].forEach(id => attribute(byId(id), 'autocomplete', 'off'));

    document.querySelectorAll('.modifierRow').forEach((row, index) => {
      const number = index + 1;
      const name = row.querySelector('.modName')?.value.trim() || 'Wertung ' + number;
      const labels = {
        '.modName': 'Name der Wertung ' + number,
        '.modOp': 'Rechenart für ' + name,
        '.modValue': 'Faktor oder Zusatzpunkte für ' + name,
        '.modRound': 'Rundung für ' + name,
        '.modifierDelete': 'Wertung ' + name + ' löschen'
      };
      Object.entries(labels).forEach(([selector, text]) => attribute(row.querySelector(selector), 'aria-label', text));
    });
    document.querySelectorAll('.announceEditorRow').forEach((row, index) => {
      const name = row.querySelector('.annName')?.value.trim() || 'Ansage ' + (index + 1);
      attribute(row.querySelector('.annName'), 'aria-label', 'Name der Ansage ' + (index + 1));
      attribute(row.querySelector('.annPoints'), 'aria-label', 'Punkte für ' + name);
      attribute(row.querySelector('.annDelete'), 'aria-label', 'Ansage ' + name + ' löschen');
    });
  }

  function labelControls() {
    document.querySelectorAll('.dealerSeat').forEach(row => {
      const name = row.querySelector('span')?.textContent.replace(/^\d+\.\s*/, '').trim() || 'Spieler';
      row.querySelectorAll('.dealerMove').forEach(button => {
        attribute(button, 'aria-label', name + (button.dataset.dir === '-1' ? ' einen Sitz nach vorne verschieben' : ' einen Sitz nach hinten verschieben'));
      });
    });
    document.querySelectorAll('[data-correct-side], [data-correct-custom]').forEach(button => {
      const side = button.dataset.correctSide || button.dataset.correctCustom;
      const name = byId('correctionName' + side)?.textContent.trim() || 'Seite ' + side;
      const custom = button.hasAttribute('data-correct-custom');
      const delta = Number(custom ? button.dataset.correctDir : button.dataset.correctDelta);
      attribute(button, 'aria-label', name + ': ' + (custom ? 'eigenen Korrekturwert ' + (delta > 0 ? 'hinzufügen' : 'abziehen') : (delta > 0 ? '+' : '') + delta + ' Punkte korrigieren'));
    });
    document.querySelectorAll('.playerManage').forEach(row => {
      const name = row.querySelector('.playerIdentity strong')?.textContent.trim() || 'Spieler';
      row.querySelectorAll('.playerActions button').forEach(button => {
        attribute(button, 'aria-label', name + ': ' + button.textContent.trim());
      });
    });
    document.querySelectorAll('.pausedGame').forEach(row => {
      const title = row.querySelector('strong')?.textContent.trim() || 'Pausierte Partie';
      row.querySelectorAll('.pausedActions button').forEach(button => {
        attribute(button, 'aria-label', title + ': ' + button.textContent.trim());
      });
    });
    const groups = {
      announcementButtons: 'Ansage oder Spiel auswählen', normalPointsButtons: 'Normale Punkte auswählen',
      modifierButtons: 'Wertung auswählen', threeDeclarerButtons: 'Ansager auswählen'
    };
    Object.entries(groups).forEach(([id, name]) => {
      const group = byId(id);
      attribute(group, 'role', 'group');
      attribute(group, 'aria-label', name);
      group?.querySelectorAll('button').forEach(button => attribute(button, 'aria-pressed', button.classList.contains('active')));
    });
    [['historyFilterToggle', 'historyFilterCard'], ['statsFilterToggle', 'statsFilterCard'], ['openCorrection', 'correctionPanel']].forEach(([buttonId, panelId]) => {
      attribute(byId(buttonId), 'aria-controls', panelId);
      attribute(byId(buttonId), 'aria-expanded', !byId(panelId)?.classList.contains('hidden'));
    });
  }

  function navigation() {
    const nav = document.querySelector('.nav');
    attribute(nav, 'role', 'navigation');
    attribute(nav, 'aria-label', 'Hauptnavigation');
    document.querySelectorAll('[data-page]').forEach(button => {
      attribute(button, 'aria-controls', 'page-' + button.dataset.page);
      attribute(button, 'aria-current', button.classList.contains('active') ? 'page' : null);
    });
    [['stats', 'Statistikbereiche'], ['more', 'Weitere Bereiche'], ['rules', 'Regelbereiche']].forEach(([kind, name]) => {
      const group = byId(kind + 'Tabs');
      attribute(group, 'role', 'group');
      attribute(group, 'aria-label', name);
      group?.querySelectorAll('[data-' + kind + ']').forEach(button => {
        const value = button.getAttribute('data-' + kind);
        const pane = document.querySelector('[data-' + kind + '-pane="' + value + '"]');
        if (pane && !pane.id) pane.id = 'section-' + kind + '-' + value;
        attribute(button, 'aria-pressed', button.classList.contains('active'));
        if (pane) attribute(button, 'aria-controls', pane.id);
      });
    });
  }

  function syncDialog() {
    if (!dialog) return;
    const open = !dialog.classList.contains('hidden');
    attribute(dialog, 'aria-hidden', !open);
    document.querySelectorAll('.gameMenuOpen').forEach(button => {
      attribute(button, 'aria-haspopup', 'dialog');
      attribute(button, 'aria-controls', dialog.id);
      attribute(button, 'aria-expanded', open);
    });
    if (open && !modalWasOpen) {
      if (!returnFocus) returnFocus = document.activeElement;
      document.querySelectorAll('.app, .nav').forEach(element => {
        backgroundState.set(element, element.inert);
        element.inert = true;
      });
      attribute(dialog, 'tabindex', '-1');
      (dialog.querySelector('#closeGameMenu') || dialog).focus({ preventScroll: true });
    } else if (!open && modalWasOpen) {
      backgroundState.forEach((inert, element) => { element.inert = inert; });
      backgroundState.clear();
      const target = visible(returnFocus) ? returnFocus : document.querySelector('.nav .tab.active');
      if (visible(target)) target.focus({ preventScroll: true });
      returnFocus = null;
    }
    modalWasOpen = open;
    if (open && (!dialog.contains(document.activeElement) || !visible(document.activeElement))) {
      (dialog.querySelector('#closeGameMenu') || dialog).focus({ preventScroll: true });
    }
  }

  function sync() {
    pending = false;
    labelFields();
    labelControls();
    navigation();
    syncDialog();
    if (replacedControl && !replacedControl.element.isConnected && document.activeElement === document.body) {
      const group = byId(replacedControl.group);
      const replacement = group && Array.from(group.querySelectorAll('button')).find(button => button.textContent === replacedControl.text);
      if (visible(replacement)) replacement.focus({ preventScroll: true });
    }
    replacedControl = null;
  }

  function schedule() {
    if (pending) return;
    pending = true;
    queueMicrotask(sync);
  }

  document.addEventListener('click', event => {
    const opener = event.target.closest?.('.gameMenuOpen');
    if (opener) returnFocus = opener;
    const button = event.target.closest?.('#activePlayers button, #teamPicker button, #announcementButtons button, #normalPointsButtons button, #modifierButtons button, #threeDeclarerButtons button');
    if (button) replacedControl = { element: button, group: button.parentElement.id, text: button.textContent };
    schedule();
  }, true);
  document.addEventListener('input', schedule);
  document.addEventListener('keydown', event => {
    if (!dialog || dialog.classList.contains('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      byId('closeGameMenu')?.click();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll(focusSelector)).filter(visible);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });
  new MutationObserver(schedule).observe(document.body, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['class', 'disabled', 'open']
  });
  sync();
})();
