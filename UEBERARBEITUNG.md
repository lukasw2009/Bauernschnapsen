# Überarbeitung vom 9. Oktober 2026

Die Oberfläche wurde für den Alltag am Handy neu gestaltet: Waldgrün, warme helle Flächen, klare Schrift, größere Bedienelemente und ein besser lesbarer Spielstand. Kleine Bildschirme, lange Spielernamen und die Navigation zwischen den Bereichen wurden berücksichtigt.

`accessibility.js` ergänzt Beschriftungen für Formulare, Namen für Sitzreihenfolge- und Korrekturknöpfe sowie erkennbare Auswahlzustände für Screenreader. Das Menü **Spielaktionen** erhält Tastaturfokus, hält ihn während des geöffneten Dialogs im Menü und lässt sich mit `Esc` schließen. Beim Schließen kehrt der Fokus zur aufrufenden Taste zurück, sofern sie noch sichtbar ist.

Spieler, Regelprofile, Ansagen, Wertungen, Punkte, Bommerl, Geberrotation, Korrekturen, pausierte Partien, Verlauf, Statistiken und Datenexport bleiben Bestandteil der App. Die vorhandene Berechnung und der lokale Datenspeicher werden weiterverwendet. Die Bedienung unterstützt weiterhin die vorhandenen Profile für zwei, drei und vier Spieler.

Die Dateien benötigen keinen Build-Schritt und keine zusätzlichen Laufzeitbibliotheken. Die App bleibt ein Punktezähler für das reale Kartenspiel. Hinweise zum Starten, zur Verwendung am Handy und zum Sichern alter Daten stehen in [README.md](README.md).
