# Prüfung der überarbeiteten App

Geprüft am 19. Oktober 2026 in Chromium unter Windows mit simulierten Handyansichten. Die App wurde außerdem mit einem echten Service Worker offline neu geladen. Die Tests verwenden eigene Testdaten, keine vorhandenen Spielstände des Nutzers.

## Ergebnis

213 Browserprüfungen bestanden: alle 75 bisherigen allgemeinen Funktionsprüfungen, 68 Prüfungen für Ansager und Statistik sowie 70 weitere Prüfungen für getrennte Flecker, normale Folgerunden und echte Siegquoten. Zusätzlich bestanden beide gesonderten Berechnungstests und die echte Offlineprüfung. Während der Prüfungen wurden keine JavaScript-Laufzeitfehler festgestellt.

- Partien für zwei, drei und vier Spieler; Spielerwahl, Teams, Sitzreihenfolge und erster Geber.
- Normale Punkte, Halbieren mit Aufrundung, Fleck, Doppelfleck, feste Ansagen, Bommerl und Partieende.
- Geberwechsel, manuelle und freie Korrekturen, Rückgängig auch nach einer gewonnenen Partie.
- Pausieren und Fortsetzen einschließlich Auswahlzuständen; gespeicherte Punkte nach erneutem Laden.
- Eigene Regelprofile, aufsteigende Zählweise und additive Wertungen.
- Verlauf, Filter, Statistik und Spielerverwaltung.
- JSON-Backup exportieren und wieder importieren, ungültige Dateien abfangen, CSV exportieren und Zurücksetzen.
- Hauptansichten ohne horizontales Überlaufen bei 320, 360, 390, 430, 768 und 1200 Pixel Breite; neue Statistikansichten zusätzlich bei 320, 390 und 768 Pixeln.
- Ansager bei zwei und vier Spielern optional erfassen; bestehende Ansagerwahl bei drei Spielern und unveränderte Punkteverteilung.
- Flecker bei Gefleckt, Doppelfleck und einer benutzerdefinierten Fleck-Wertung; beim Wechsel zur normalen Wertung wird keine veraltete Fleckerwahl übernommen.
- Fleck und Doppelfleck speichern zwei unterschiedliche Personen. Die erste Person ist in der zweiten Auswahl gesperrt; widersprüchliche Rollen werden auch beim Import bereinigt.
- Nach Halbiert, Fleck oder Doppelfleck startet die nächste eingetragene Runde mit normaler Wertung und ohne Flecker-Auswahl. Das gilt auch für drei Spieler. Beim Rückgängigmachen werden die ursprüngliche Wertung und beide Rollen wiederhergestellt.
- Auswahlentwurf einschließlich Ansager und Flecker nach Neuladen sowie nach Pausieren und Fortsetzen. Rückgängig stellt die Auswahl der zurückgenommenen Runde wieder her.
- Ansager und Flecker im Verlauf, im CSV und nach einem vollständigen JSON-Backup-Import erhalten.
- Beide Flecker bleiben nach Neuladen, Pause/Fortsetzen, Rücknahme und Backup erhalten. CSV und Verlauf weisen ersten Fleck und Doppelfleck getrennt aus.
- Kontrollierter Statistikdatensatz: Land-Anteil 40 % insgesamt, 50 % mit Profilfilter und 37,5 % mit Tagesfilter; Punktekorrekturen ausgeschlossen.
- Tatsächliche Land-Siegquote: ein Sieg des Ansagerteams aus fünf auswertbaren Land-Runden ergibt 20 %. Ein weiterer Filterdatensatz ergibt 25 %. Unbekannte Ansager, fehlende eindeutige Ergebnisse und Punktekorrekturen werden aus dem Siegquoten-Nenner ausgeschlossen.
- Persönliche Spielanteile und Siegquoten; bei gleicher Land-Anzahl geteilte Führung. Der Rundensieger wird nicht als Ansager geraten.
- Alte Runden ohne Rollen bleiben unzugeordnet und zählen weiterhin zur Gesamthäufigkeit. Fehlende Zuordnungen werden sichtbar ausgewiesen.
- Echte Offline-Neuladung mit allen 15 Cache-Adressen einschließlich der neuen Statistikdatei; Testspielerdaten bleiben unverändert. Erstinstallation löst keinen unerwarteten Neustart aus.

Zusätzlich wurden die JavaScript-Syntax aller Projektdateien und die reine Statistikberechnung geprüft: leere Daten, verschiedene Nenner, Normal, Zweier- und Dreierwertung, Gleichstände, fehlende Ergebnisse, sichere Textausgabe und keine Veränderung der übergebenen Runden. Die neuen Ansichten für Rundeneingabe, Spielanteile, Rangliste und persönliche Ansagen wurden visuell kontrolliert.

Die Punkteberechnung und die bisherige Speicherkennung bleiben erhalten. Runden werden um optionale Rollen für Ansager, ersten Flecker und Doppelflecker sowie Grundpunkte ergänzt; ein Auswahlentwurf speichert die noch nicht eingetragene Runde. Alle ursprünglichen Projektdateien sind im Paket enthalten.

Ein physisches Android-Handy oder iPhone wurde nicht getestet. Die Anleitung für Installation und Datenübernahme steht in `README.md`.

Der Offlinecache trägt die neue Kennung `v24-20261019` und enthält die Statistikdatei vor der bestehenden App. Der bisherige Ablauf zur bewussten Aktualisierung bleibt bestehen.
