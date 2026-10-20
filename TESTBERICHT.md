# Prüfbericht · Spielerprofile und vollständige Runden

Geprüft am 20. Oktober 2026 in Chromium unter Windows mit simulierten Handyansichten. Alle Tests verwenden eigene Daten; auf Spielstände auf dem Handy wurde nicht zugegriffen.

## Ergebnis

169 Browserprüfungen bestanden: 94 neue Prüfungen und 75 bestehende Funktionsprüfungen. Bei den bestehenden Tests ergänzt ein Testhelfer die jetzt erforderlichen Rollen; die Punkteberechnung bleibt geprüft. Hinzu kommen separate Berechnungstests, visuelle Kontrollen und ein echter Offline-Neustart. Keine JavaScript-Laufzeit- oder Konsolenfehler.

## Nachgestellte und behobene Speicherfehler

- Der alte Doppeltipp-Schutz verwarf auch eine bewusst geänderte zweite Runde innerhalb von 420 ms. Jetzt werden solche Eingaben gespeichert; ein unveränderter versehentlicher Doppeltipp zählt weiterhin nur einmal.
- Bei fehlgeschlagenem Schreiben wurde zuvor bereits der neue Stand angezeigt. Ein Rundeneintrag wird jetzt erst nach erfolgreichem Schreiben und identischem Rücklesen bestätigt.
- Ein Schreibfehler oder ein wirkungsloser Schreibaufruf lässt Spielstand, Verlauf und Eingabe unverändert. Die Fehlermeldung ist sichtbar; ein unmittelbarer neuer Versuch ist möglich.
- Das gilt ausdrücklich auch für die letzte, siegbringende Runde: Bei einem Fehler bleiben laufende Partie und bisheriger Stand erhalten; ein neuer Versuch erzeugt genau eine Runde und ein Resultat.
- Die zuletzt gespeicherte Runde wird sichtbar mit Spielart, Wertung, Punkten, Sieger und Rollen bestätigt. Siegrunde, Resultat, Neuladen und Rücknahme sind geprüft.

## Rollen und Verlauf

- Normal ohne Sonderwertung hat keinen Ansager. Zu dritt wird nur ein Ergebnisspieler für die unveränderte Punkteverteilung gewählt; er wird nicht als Ansager gewertet.
- Ansagen und gewertete normale Spiele benötigen eine Spielerzuordnung.
- Fleck benötigt einen anderen Spieler als den Ansager. Doppelfleck erfasst drei verschiedene Personen: Ansager, erster Flecker, Doppelflecker.
- Halbiert erfasst Ansager und Halbierer; beide dürfen dieselbe Person sein.
- Rollen und Auswahlentwürfe bleiben bei Neuladen, Pausieren, Fortsetzen, Rücknahme und Backup erhalten. Verlauf und CSV enthalten auch den Halbierer.
- Nach dem Eintragen steht die Wertung der nächsten Runde wieder auf Normal. Punktekorrekturen, Bommerl, zwei/drei/vier Spieler und Regelprofile bleiben funktionsfähig.

## Profile und Statistiken für alle Spielarten

- Spielernamen in der Statistik und Spielerverwaltung öffnen ein Profil; Schließen, Esc, Fokus-Rückgabe und die mobile Darstellung sind geprüft.
- Jede Teilnahme erhält das tatsächliche Team-Ergebnis einmal: Pluspunkte bei Sieg, Minuspunkte bei Niederlage, Saldo = Plus minus Minus.
- Fleck, Doppelfleck und Halbierung sind bereits in der gespeicherten Rundenwertung enthalten. Sie werden statistisch nicht erneut multipliziert. Ein doppelt geflecktes Land zählt mit 36, ein aufgerundetes halbiertes Land mit 5 Punkten, auch wenn der Spielstand an 0 begrenzt wird.
- Rollenpunkte werden getrennt angezeigt und nicht zusätzlich zu den Teilnahme-Punkten addiert. Geprüft wurde unter anderem +7/−7/Saldo 0 je Teilnehmer ohne doppelte Zählung.
- Profile zeigen Gesamtwerte, jede Spielart, eigene Ansagen, Flecks, Doppelflecks, Halbierungen, Erfolgsquoten sowie Plus-/Minuspunkte und Saldo.
- Ranglisten funktionieren pro Spielart und für alle Spielarten gemeinsam: Ansagen, erster Fleck, Doppelfleck, Halbiert, Pluspunkte, Minuspunkte, Saldo. Gleichstände behalten denselben Rang.
- Siegquoten beziehen sich auf auswertbare Ergebnisse der jeweiligen Rolle. Unbekannte historische Rollen werden nicht geraten. Normales Grundspiel zählt als Teilnahme und zur Häufigkeit, aber nicht als Ansage.
- Punktekorrekturen sind ausgeschlossen. Zeitraum-, Profil- und Partiefilter gelten auch für Profile und Ranglisten.

## Offline und Darstellung

Alle 15 Ressourcen des Caches v25-20261020 werden offline geladen, einschließlich der Statistikdatei vor der App. Erstinstallation ohne ungefragten Neustart, Testspieler nach Offline-Neuladen erhalten. Eingabe, Verlauf, Statistik und Profile ohne horizontales Überlaufen bei 320, 390 und 768 Pixel Breite geprüft. JavaScript-Syntax aller Projektdateien bestanden.

Ein physisches Android-Handy oder iPhone wurde nicht getestet. Die tatsächliche fehlende Runde auf einem anderen Gerät wurde nicht rekonstruiert. Start, Installation und Übernahme per Backup stehen in README.md.
