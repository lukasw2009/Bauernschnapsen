# Überarbeitungen

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
