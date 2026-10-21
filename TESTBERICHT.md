# Prüfbericht · Persönliche Punkte und tatsächliche Abzüge

Geprüft am 21. Oktober 2026 lokal in Chromium unter Windows mit eigenen Testdaten. Auf Spielstände eines Handys wurde nicht zugegriffen.

## Aktueller Prüfstand

265 automatisierte Prüfungen sind bestanden: 168 neue fachliche Browserprüfungen, 75 bestehende Funktionsprüfungen und 22 lokale Offline- und Aktualisierungsprüfungen. Die bestehenden Tests ergänzen lediglich die inzwischen erforderlichen Rolleneingaben durch einen Testhelfer. Zusätzliche separate Berechnungstests der neuen persönlichen Punkte sind ebenfalls bestanden. Es traten keine JavaScript-Laufzeit- oder Konsolenfehler auf.

| Prüffeld | Erwartetes Verhalten | Status |
| --- | --- | --- |
| Persönliche Rollen | Nur ausdrücklich erfasste Ansager, Flecker, Doppelflecker und Halbierer erhalten persönliche Plus-/Minuspunkte; passive Partner bleiben bei 0. | Bestanden |
| Normales Grundspiel | Persönliche Punkte bleiben für alle Spieler 0; verändertes Normal mit einer erfassten Rolle wird passend ausgewertet. | Bestanden |
| Restpunkte zu zweit/viert | Bei 2 Restpunkten zählt ein tatsächlicher Gewinnabzug von 2 als +2 bzw. −2 für die erfasste Rolle; geprüft auch vor Bommerl-Neustart und am Partieende. | Bestanden |
| Drei Spieler | Gewinnerrollen erhalten den eigenen tatsächlichen Abzug; Verliererrollen den größten einzelnen Gewinnerabzug als Einsatz, keine Summe. | Bestanden |
| Aufwärtszählende Regeln | Der tatsächliche Punktegewinn bis zur Zielgrenze wird passend ausgewertet. | Bestanden |
| Mehrere eigene Rollen | Ansager und Halbierer derselben Person erzeugen insgesamt keine doppelten persönlichen Punkte; Halbierung, Rundung und Begrenzung sind geprüft. | Bestanden |
| Gespeicherte Runden | Zuordnungen und zuverlässige Punktestände werden ausgewertet; ohne rekonstruierbaren Abzug dient der vorhandene Rundenwert als Rückfall. Fehlende Rollen werden nicht geraten. | Bestanden |
| Profile und Ranglisten | Persönliche Bilanz und Rollenauswertungen verwenden dieselben neuen Regeln; Rollenteilmengen werden nicht zusätzlich addiert. | Bestanden |
| Verlauf und CSV | Regelwert und effektiver Abzug bleiben getrennt erkennbar, auch für die individuellen Abzüge bei drei Spielern. | Bestanden |
| Speichern und Eingabeschutz | Schreib-/Rücklesefehler rollen die Eingabe nicht als Erfolg weiter; erneuter Versuch, schnelle geänderte Folgerunden und Doppeltipps sind geprüft. | Bestanden |
| Offline und Aktualisierung | Alle 15 Ressourcen im Cache v26-20261021, kein ungefragter Neustart, Aktualisierung per Klick und erhaltene Daten nach Offline-Neuladen. | 22 Prüfungen bestanden |

## Bestätigte fachliche Fälle

Bei einem doppelt gefleckten Land mit 2 verbleibenden Punkten bleibt der rechnerische Regelwert getrennt gespeichert; die persönliche Auswertung verwendet nur den tatsächlichen Abzug von 2. Das wurde vor einem Bommerl-Neustart und für die letzte Gewinnrunde geprüft. Zu dritt wurden unterschiedliche tatsächliche Gewinnerabzüge von 2 und 7 nachgestellt: Die jeweilige Gewinnerrolle erhält ihren eigenen Abzug, eine Verliererrolle höchstens 7 als verlorenen Einsatz, keine Summe von 9.

Reines Normal und nicht persönlich zugeordnete Partner ergeben keine persönlichen Punkte. Eigene Rollen bei verändertem Normal, Halbierung mit Aufrundung und Begrenzung sowie dieselbe Person als Ansager und Halbierer sind geprüft. Die ursprüngliche Spielertabelle, die Profile, die einzelnen Spielarten und die Ranglisten stimmen überein. Historische Punktestände, unbekannte Rollen, die CSV-Ausgabe und aufwärtszählende Regeln sind abgedeckt.

Auch bei Schreibfehlern und nicht bestätigtem Rücklesen bleiben Spielstand, Verlauf und Eingabe erhalten; ein unmittelbarer neuer Versuch speichert genau einmal. Das gilt ebenfalls beim Bommerl-Neustart und am Partieende. Die mobilen Ansichten mit 320, 390 und 768 Pixel Breite zeigen kein horizontales Überlaufen.

## Bestätigte Offline- und Aktualisierungsprüfung

Auf einem lokalen Testserver wurde zunächst die unveränderte Fassung v25 aus dem vorhandenen ZIP geladen. Drei eigene gespeicherte Runden mit Rollen und Punkteständen wurden anschließend über den tatsächlichen Aktualisieren-Knopf auf v26 übernommen. Spieler, Rollen, Originalwerte und Punktestände blieben erhalten; der Klick löste genau einen Neustart aus. Vor dem Klick wurde weiterhin die vollständige alte Fassung verwendet.

Die übernommenen Testfälle enthalten eine Doppelfleck-Runde mit 2 tatsächlichen Restpunkten, eine halbierte Runde mit 5 tatsächlichen Punkten und derselben Person als Ansager und Halbierer sowie eine normale Runde ohne persönliche Punkte. Die persönlichen Bilanzen lauten dabei +7, +2, −2 und 0; die passive vierte Person erhält keine Punkte. Das geöffnete Spielerprofil zeigt die erwartete persönliche Bilanz +7/0/7. Diese Werte und sämtliche drei Runden bleiben nach einem Offline-Neustart identisch.

Alle 15 Ressourcen werden vollständig aus dem Cache v26-20261021 geladen, einschließlich des unveränderten finalen Statistikquelltexts. Eine zusätzliche frische Installation bei 320 Pixel Breite verursacht keinen ungefragten Neustart und keinen falschen Aktualisierungshinweis; der angelegte Testspieler bleibt offline erhalten. Über beide Durchläufe traten keine JavaScript-Laufzeitfehler auf.

Ein physisches Android-Handy oder iPhone wurde nicht getestet. Die tatsächlich fehlende Runde auf einem anderen Gerät wurde nicht rekonstruiert. Start, Installation und Übernahme per Backup stehen in README.md.
