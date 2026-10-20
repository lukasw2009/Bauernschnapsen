# Bauernschnapsen · Punkte & Partien

Eine für das Handy gestaltete Web-App zum Mitschreiben beim echten Kartenspiel: Spieler, Ansagen, Punkte, Bommerl, Geber, pausierte Partien, Verlauf und Statistiken. Enthalten sind Profile für vier, zwei und drei Spieler sowie eigene Regeln. Die App ist ein Punktezähler; sie verteilt oder spielt keine Karten.

## Loslegen

1. Das ZIP vollständig entpacken. Alle App-Dateien im selben Ordner lassen.
2. Im Ordner mit `index.html` ein Terminal öffnen und mit installiertem Python starten:

   ```powershell
   python -m http.server 8080
   ```

3. Am Computer [http://localhost:8080](http://localhost:8080) öffnen. Das Terminal bleibt währenddessen offen; `Strg+C` beendet den Testserver. Der Python-Testserver ist für lokale Tests vorgesehen. [Python-Dokumentation](https://docs.python.org/3/library/http.server.html)

Zum Testen am Handy können Computer und Handy dasselbe WLAN verwenden. Im Handybrowser `http://<IP-Adresse-des-Computers>:8080` aufrufen. Falls Windows den Zugriff blockiert, den lokalen Server im privaten Netzwerk zulassen. Auf dieser HTTP-WLAN-Adresse kann der Punktezähler getestet werden; Installation und Offlinebetrieb benötigen eine geeignete HTTPS-Adresse.

Für den regulären Einsatz am Handy den gesamten App-Ordner auf einem Webserver mit HTTPS bereitstellen. Dann über die Installationsfunktion des Browsers zum Startbildschirm hinzufügen. Nach einem vollständigen ersten Laden über HTTPS steht die App auch offline zur Verfügung. Die Ausnahme `localhost` gilt jeweils auf dem Gerät selbst. [PWA-Voraussetzungen](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)

## Eine Partie führen

- Unter **Runde** Regelprofil wählen, Namen hinzufügen, Spieler und Seite 1 auswählen. Geber und Sitzreihenfolge lassen sich aufklappen. Danach **Spiel starten**.
- Spielart, Punkte und Wertung auswählen und den Rundensieger antippen. **Normal** ohne zusätzliche Wertung benötigt keinen Ansager. Zu dritt wird dafür ein **Ergebnis-Spieler** für die Punkteverteilung ausgewählt; dadurch wird ihm keine Ansage zugeschrieben. Für eine Ansage und für eine mit **Halbiert**, **Gefleckt** oder **Doppelfleck** veränderte Normalrunde wird der zugehörige Spieler gewählt.
- Jede neue Runde beginnt mit der Wertung **Normal**. **Halbiert**, **Gefleckt** und **Doppelfleck** werden nur bei Bedarf ausgewählt. Nach dem Eintragen einer Runde springt die Wertung automatisch auf **Normal** zurück; beim Zurücknehmen wird die vorherige Auswahl wiederhergestellt.
- Bei **Gefleckt** Ansager und ersten Flecker als zwei verschiedene Spieler auswählen. Bei **Doppelfleck** werden Ansager, erster Flecker und zweiter Flecker getrennt gewählt: alle drei müssen verschiedene Spieler sein. Bei **Halbiert** sind Ansager und Halbierer erforderlich; hier darf dieselbe Person beide Rollen übernehmen. Reines **Normal** benötigt keine dieser Rollen. Die Auswahl der beteiligten Personen ersetzt nicht die Auswahl des Rundensiegers.
- **Stand** zeigt Punkte, Bommerl, Geber und Punkteverlauf. Über **•••** lassen sich Runden zurücknehmen, Punkte korrigieren und Partien pausieren oder beenden.
- **Verlauf** und **Statistik** bieten Filter. Unter **Mehr** liegen Spieler, Regeln sowie **Daten** mit JSON-Backup, Import und CSV-Export.

## Eine Runde speichern

Die App bestätigt eine Runde erst, wenn der gespeicherte Stand zur Kontrolle wieder aus dem Browserspeicher gelesen wurde. Das gilt auch für die letzte Runde, die eine Partie beendet. Wenn das Speichern fehlschlägt, erscheint eine Fehlermeldung; der bisherige Spielstand und die Eingabe bleiben erhalten, damit die Runde erneut gespeichert werden kann.

Bewusst geänderte Folgerunden können direkt nacheinander eingetragen werden. Ein unveränderter schneller Doppeltipp bleibt gegen versehentliches doppeltes Erfassen geschützt.

## Ansagen und Spielarten auswerten

Die **Siegquote** einer Spielart zeigt, wie oft das ausdrücklich erfasste Ansagerteam gewonnen hat. Gezählt werden nur Runden mit bekanntem Ansager und eindeutigem Ergebnis. Beispiel: Wird bei fünf auswertbaren Land-Runden das Land einmal gewonnen, beträgt die Siegquote **20 %**. Ohne auswertbares Ergebnis wird keine Siegquote angenommen.

Daneben zeigt die Statistik die **Spielhäufigkeit** und den **Spielanteil** jeder Spielart. Der Spielanteil bezieht sich auf alle Runden innerhalb der gewählten Filter; reine Punktekorrekturen zählen nicht als gespielte Runden. Spielanteil und Siegquote haben unterschiedliche Grundlagen.

Die Auswertung je Spieler verwendet ausschließlich ausdrücklich eingetragene Ansager, erste Flecker, zweite Flecker und Halbierer. Ältere Runden ohne diese Angaben und Runden mit unbekannter Zuordnung bleiben unzugeordnet. Der Gewinner einer Runde wird nicht nachträglich als Ansager oder Flecker angenommen. Fehlende Rollen und unbekannte Ergebnisse werden nicht aus alten Daten erraten. Deshalb kann die Summe der persönlich zugeordneten Ansagen kleiner sein als die Gesamtzahl der gespielten Ansagen.

Die Spielartenanteile eines Spielers beziehen sich auf seine eigenen erfassten Ansagen. Bei der Ranglisten-Auswahl **Ansagen** wird für die gewählte Spielart die Anzahl der ausdrücklich zugeordneten Ansagen verglichen.

## Spielerprofile und Punktebilanz

In der Statistik lässt sich ein Spielername zum persönlichen Profil öffnen. Dort stehen die Auswertungen nach Spielart, Fleck, Doppelfleck, Halbieren und Erfolg sowie Pluspunkte, Minuspunkte und Netto (**Saldo**). Die zugehörigen Ranglisten erlauben den Vergleich zwischen den Spielern.

Die Punktebilanz wird getrennt von den erfassten Ansagerrollen berechnet. Für jeden Teilnehmer zählt der bereits berechnete Rundenwert genau einmal positiv auf der Gewinnerseite oder negativ auf der Verliererseite. Netto ist Plus minus Minus. Rollenpunkte im Profil sind Teilmengen dieser Teamwerte und werden nicht zusätzlich zur Bilanz addiert. Bei den mitgelieferten Regeln zählt ein Land mit Doppelfleck deshalb **9 × 4 = 36 Punkte**, ein halbiertes Land aufgerundet **5 Punkte**. Diese Werte werden in der Statistik nicht erneut vervielfacht. Auch wenn der Spielstand am Rundenende bei null stoppt, bleibt der volle berechnete Rundenwert für die Bilanz maßgeblich. Punktekorrekturen sind keine gespielten Runden.

## Daten bei einer Aktualisierung behalten

Vor dem Ersetzen der bisherigen App unter **Mehr → Daten → Backup** eine JSON-Datei speichern. Die neue Version unter derselben Adresse im selben Browser verwenden: lokale Daten sind an Protokoll, Host und Port gebunden. Bei einer neuen Adresse oder einem anderen Browser das Backup importieren; der Import ersetzt die dort vorhandenen Daten.

Die App speichert lokal im Browser und synchronisiert nicht zwischen Geräten. Browserdaten nicht löschen, wenn keine Sicherung vorhanden ist. Bestehende Speicherkennungen und die bisherigen Spielregeln bleiben erhalten. Änderungen dieser Fassung stehen in [UEBERARBEITUNG.md](UEBERARBEITUNG.md).
