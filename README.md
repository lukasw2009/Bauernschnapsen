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
- Ansage, normale Punkte und Wertung auswählen und den Rundensieger antippen. Bei drei Spielern zunächst den Ansager wählen.
- **Stand** zeigt Punkte, Bommerl, Geber und Punkteverlauf. Über **•••** lassen sich Runden zurücknehmen, Punkte korrigieren und Partien pausieren oder beenden.
- **Verlauf** und **Statistik** bieten Filter. Unter **Mehr** liegen Spieler, Regeln sowie **Daten** mit JSON-Backup, Import und CSV-Export.

## Daten bei einer Aktualisierung behalten

Vor dem Ersetzen der bisherigen App unter **Mehr → Daten → Backup** eine JSON-Datei speichern. Die neue Version unter derselben Adresse im selben Browser verwenden: lokale Daten sind an Protokoll, Host und Port gebunden. Bei einer neuen Adresse oder einem anderen Browser das Backup importieren; der Import ersetzt die dort vorhandenen Daten.

Die App speichert lokal im Browser und synchronisiert nicht zwischen Geräten. Browserdaten nicht löschen, wenn keine Sicherung vorhanden ist. Bestehende Speicherkennungen und die bisherigen Spielregeln bleiben erhalten. Änderungen dieser Fassung stehen in [UEBERARBEITUNG.md](UEBERARBEITUNG.md).
