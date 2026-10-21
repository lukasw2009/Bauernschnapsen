# Überarbeitungen

## 21. Oktober 2026 · Persönliche Punkte aus tatsächlichen Abzügen

Plus- und Minuspunkte werden nur persönlich erfassten Ansagern, Fleckern, Doppelfleckern und Halbierern zugeordnet. Ein Spielpartner ohne eigene Rolle erhält keine persönlichen Punkte. Reines Normal zählt persönlich immer **0**. Teilnahme, Spielhäufigkeit und die Änderung des Spielstands bleiben davon getrennt.

Zu zweit und zu viert ist der tatsächliche Abzug der Gewinnerseite maßgeblich. Bei 2 Restpunkten zählen daher **+2** für eine Gewinnerrolle beziehungsweise **−2** für eine Verliererrolle, auch wenn der rechnerische Ansagewert höher wäre. Ein Fleckfaktor wird auf diesen Abzug nicht nochmals angewendet.

Zu dritt zählt für jede Gewinnerrolle der tatsächliche Abzug ihres eigenen Kontos. Eine Verliererrolle erhält den größten einzelnen Gewinnerabzug als verlorenen Einsatz, nicht die Summe aller Gewinnerabzüge. Mehrere Rollen derselben Person erzeugen innerhalb einer Runde keine doppelten persönlichen Punkte; das gilt insbesondere für Ansager und Halbierer. Die einzelnen Rollenansichten werden nicht zusätzlich zur persönlichen Bilanz addiert.

Historische Runden nutzen vorhandene zuverlässige Punktestände zur Rückrechnung. Fehlen diese Angaben, bleibt der gespeicherte Rundenwert die Grundlage; unbekannte damalige Restpunkte und fehlende Rollen werden nicht nachträglich angenommen.

Der Offlinecache verwendet die neue Version `v26-20261021` und umfasst weiterhin sämtliche 15 Ressourcen. Die gezielten lokalen Prüfungen der neuen Punkteberechnung sowie des Offline- und Aktualisierungsverhaltens werden im Prüfbericht dokumentiert.

## 20. Oktober 2026 · Rollen, Spielerprofile und Punktebilanz

Reines **Normal** ohne zusätzliche Wertung benötigt keinen Ansager. Zu dritt dient die separate Auswahl eines Ergebnis-Spielers nur der Punkteverteilung und schreibt diesem keine Ansage zu. Für Ansagen sowie halbierte, gefleckte oder doppelt gefleckte Normalrunden wird der zugehörige Spieler gewählt. **Gefleckt** benötigt verschiedene Personen für Ansager und Flecker; bei **Doppelfleck** sind Ansager, erster Flecker und zweiter Flecker drei verschiedene Spieler. Bei **Halbiert** werden Ansager und Halbierer ausgewählt; dieselbe Person darf beide Rollen übernehmen. Die nächste Runde beginnt weiterhin ohne zusätzliche Wertung; das Zurücknehmen stellt die vorherige Auswahl wieder her.

Spielernamen in der Statistik öffnen persönliche Profile. Die Auswertungen und Ranglisten umfassen die Spielarten, Fleck, Doppelfleck, Halbieren und Erfolg sowie Pluspunkte, Minuspunkte und Netto. Persönliche Ansagenstatistiken verwenden ausschließlich ausdrücklich gespeicherte Rollen. Alte fehlende Zuordnungen und unbekannte Ergebnisse werden nicht nachträglich angenommen.

Die fachliche Berechnung der persönlichen Punkte wurde am 21. Oktober präzisiert. Für die aktuelle Fassung gelten ausschließlich die oben beschriebenen persönlich erfassten Rollen und tatsächlichen Punkteabzüge.

Die Speicherung einer Runde wird durch erneutes Lesen des geschriebenen Browserstands geprüft. Erst danach zeigt die App die Runde als erfolgreich gespeichert an, einschließlich der letzten Gewinnrunde einer Partie. Schlägt das Speichern fehl, wird die Runde nicht als übernommen angezeigt: der vorherige Spielstand und die Rundeneingabe bleiben erhalten, und eine Fehlermeldung ermöglicht den erneuten Versuch. Bewusst veränderte Folgerunden können unmittelbar eingetragen werden; die Sperre gegen schnelle Doppeltipps greift nur bei unveränderter Eingabe.

Die neue Cacheversion speichert weiterhin die vollständige Oberfläche einschließlich der Statistikdatei offline. Das Aktualisieren bleibt eine bewusste Aktion; die bisherigen Speicherkennungen werden weiterverwendet.

## 19. Oktober 2026 · Ansager, Flecker und Statistiken

Ansager können jetzt in allen Spielmodi festgehalten werden. Bei drei Spielern bleibt die Auswahl für die bestehende Punkteverteilung erforderlich. Bei zwei und vier Spielern kann die Zuordnung unbekannt bleiben. Für **Gefleckt** lässt sich der erste Flecker erfassen. Bei **Doppelfleck** kann zusätzlich eine andere Person als zweiter Flecker gewählt werden. Beide Angaben sind optional; dieselbe Person erhält nicht beide Rollen. Bei **Normal** und **Halbiert** werden keine Flecker erfasst. Der Rundensieger wird weiterhin getrennt ausgewählt; die bisherigen Spielregeln und Punkteberechnungen bleiben erhalten.

Die Wertung beginnt pro Runde mit **Normal** und kehrt nach jeder eingetragenen Runde automatisch dorthin zurück. Halbieren, Fleck oder Doppelfleck müssen für die nächste Runde erneut gewählt werden. Das Zurücknehmen einer Runde stellt deren vorherige Auswahl wieder her.

Die Siegquote jeder Spielart berechnet sich aus Siegen des ausdrücklich erfassten Ansagerteams geteilt durch dessen auswertbare Ergebnisse. Ein gewonnenes Land bei fünf auswertbaren Land-Runden ergibt **20 %**. Runden ohne bekannten Ansager oder eindeutiges Ergebnis werden nicht als gewonnene oder verlorene Ansagen angenommen.

Spielhäufigkeiten und Spielanteile werden separat ausgewiesen. Für den Spielanteil zählen sämtliche Runden innerhalb der gewählten Filter; Punktekorrekturen zählen nicht als gespielte Runden. Persönliche Auswertungen berücksichtigen ausschließlich ausdrücklich erfasste Ansager sowie erste und zweite Flecker. Alte Runden ohne diese Angaben bleiben unzugeordnet; historische Rollen und unbekannte Ergebnisse werden nicht nachträglich erraten.

Die neue Datei `announcement-stats.js` wird vor der bestehenden App geladen und zusammen mit der übrigen Oberfläche im Offlinecache gespeichert. Die neue Cacheversion wird wie bisher erst nach einem bewussten Aktualisieren aktiviert. Lokale Spielerdaten, Regeln und Verläufe werden weiterhin unter den bisherigen Speicherkennungen geführt.

## 9. Oktober 2026 · Gestaltung für das Handy

Die Oberfläche wurde für den Alltag am Handy neu gestaltet: Waldgrün, warme helle Flächen, klare Schrift, größere Bedienelemente und ein besser lesbarer Spielstand. Kleine Bildschirme, lange Spielernamen und die Navigation zwischen den Bereichen wurden berücksichtigt.

`accessibility.js` ergänzt Beschriftungen für Formulare, Namen für Sitzreihenfolge- und Korrekturknöpfe sowie erkennbare Auswahlzustände für Screenreader. Das Menü **Spielaktionen** erhält Tastaturfokus, hält ihn während des geöffneten Dialogs im Menü und lässt sich mit `Esc` schließen. Beim Schließen kehrt der Fokus zur aufrufenden Taste zurück, sofern sie noch sichtbar ist.

Spieler, Regelprofile, Ansagen, Wertungen, Punkte, Bommerl, Geberrotation, Korrekturen, pausierte Partien, Verlauf, Statistiken und Datenexport bleiben Bestandteil der App. Die vorhandene Berechnung und der lokale Datenspeicher werden weiterverwendet. Die Bedienung unterstützt weiterhin die vorhandenen Profile für zwei, drei und vier Spieler.

Die Dateien benötigen keinen Build-Schritt und keine zusätzlichen Laufzeitbibliotheken. Die App bleibt ein Punktezähler für das reale Kartenspiel. Hinweise zum Starten, zur Verwendung am Handy und zum Sichern alter Daten stehen in [README.md](README.md).
