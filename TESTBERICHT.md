# Prüfung der überarbeiteten App

Geprüft am 9. Oktober 2026 in Chromium unter Windows mit simulierten Handyansichten. Die App wurde außerdem mit einem echten Service Worker offline neu geladen. Die Tests verwenden eigene Testdaten, keine vorhandenen Spielstände des Nutzers.

## Ergebnis

131 Prüfungen bestanden: 75 allgemeine Funktions- und Layoutprüfungen, 6 Offlineprüfungen und 50 zusätzliche Prüfungen für kleine Bildschirme, lange Namen und ältere Daten. Während dieser Prüfungen wurden keine JavaScript-Laufzeitfehler festgestellt.

- Partien für zwei, drei und vier Spieler; Spielerwahl, Teams, Sitzreihenfolge und erster Geber.
- Normale Punkte, Halbieren mit Aufrundung, Fleck, Doppelfleck, feste Ansagen, Bommerl und Partieende.
- Geberwechsel, manuelle und freie Korrekturen, Rückgängig auch nach einer gewonnenen Partie.
- Pausieren und Fortsetzen einschließlich Auswahlzuständen; gespeicherte Punkte nach erneutem Laden.
- Eigene Regelprofile, aufsteigende Zählweise und additive Wertungen.
- Verlauf, Filter, Statistik und Spielerverwaltung.
- JSON-Backup exportieren und wieder importieren, ungültige Dateien abfangen, CSV exportieren und Zurücksetzen.
- Hauptansichten ohne horizontales Überlaufen bei 320, 360, 390, 430, 768 und 1200 Pixel Breite.
- Offline-Neuladen mit gespeichertem Design, Spielern und interaktiver Bedienung; Änderungen bleiben nach erneuter Verbindung erhalten.
- Lange Namen mit 20 Zeichen bei 320 × 568 Pixeln: Vorbereitung, Rundeneingabe, Spielstände, Regel-Editoren und sämtliche Korrektur- und Spielaktionen bleiben erreichbar. Das geöffnete Menü lässt sich vertikal scrollen.
- Die Übernahme älterer V1- und V2-Daten wurde mit der Original-App aus dem eingesandten ZIP verglichen. Die resultierenden Daten einschließlich Spielerkennungen, Verlauf und Schema sind identisch.

Zusätzlich wurden die JavaScript-Syntax aller Projektdateien, die Abmessungen der Installationssymbole sowie Dialogfokus, Tab-Begrenzung, Esc, Fokus-Rückgabe und Beschriftungen im Regel-Editor geprüft. Die Ansichten für Vorbereitung, Rundeneingabe, Stand, Verlauf, Statistik, Menü und Regeln wurden visuell kontrolliert.

Die Berechnung und das bestehende Datenformat bleiben erhalten. In `app.js` wurden nur die bisherige Zoomsperre entfernt und der Schutz für ungespeicherte Regeländerungen beim Aktualisieren ergänzt. Alle ursprünglichen Projektdateien sind im Paket enthalten.

Ein physisches Android-Handy oder iPhone wurde nicht getestet. Die Anleitung für Installation und Datenübernahme steht in `README.md`.

Der tatsächliche Updateablauf wurde mit zwei Versionen und zwei gleichzeitig geöffneten Tabs geprüft: HTML, CSS und JavaScript wechseln gemeinsam erst nach **Aktualisieren**. Ein anderer geöffneter Tab wird dabei nicht ungefragt neu geladen; gespeicherte Daten und Offlinebetrieb bleiben erhalten.
