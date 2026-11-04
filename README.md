# SET

Mobile-first Workout-PWA mit React, TypeScript, Vite, Tailwind, Dexie/IndexedDB, React Router, Recharts, date-fns und Tesseract.js. Monochrome Oberfläche; keine Accounts, Werbung oder vorbefüllte Trainingshistorie.

## Start

Node.js 22.12+ verwenden.

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

## Implementiert

- Dashboard mit echten gespeicherten Werten, letztem Workout und Fortsetzen.
- Freie Workouts und unabhängige Vorlagen, Duplikation, Bearbeitung und Löschen.
- Aufklappbare Übungskarten, Satzverwaltung, Plus/Minus, Abschlussstatus und IndexedDB-Autosave.
- Übungsbibliothek, Suche, Filter, Favoriten, Bearbeitung, Notizen und individuelle Pausenzeit. Historische Namen bleiben beim Löschen erhalten.
- Persistenter Pausentimer mit absolutem Endzeitpunkt, Pause, Fortsetzen, +30 Sekunden und Schließen.
- Monatskalender mit Montag als Wochenbeginn und nachträglich bearbeitbaren Workouts.
- Diagramme für Volumen, Häufigkeit und maximale Gewichte; Rekorde für gewählten Zeitraum.
- Lokale Tesseract-Erkennung mit Deutsch/Englisch, Graustufen-Vorverarbeitung, editierbarer Vorschau und einfachem Tabellenparser; lbs-Umrechnung. Unbekanntes Datum bleibt leer, Satzstatus wird nicht erfunden.
- JSON-Backup mit Schema-Prüfung, Vorschau durch Bestätigungsdialog und transaktionaler vollständiger Wiederherstellung.
- Manifest, Workbox-Service-Worker und Hantel-Icons für installierbare PWA.

## Datenspeicherung und Backup

Alle Workouts, Vorlagen, Definitionen und Einstellungen liegen in IndexedDB im Browser. Kein Server erhält Trainingsdaten. Screenshots bleiben temporär im Speicher und werden nach dem Import verworfen. Browserdaten können vom Nutzer oder Betriebssystem gelöscht werden. Regelmäßig unter Einstellungen ein JSON-Backup exportieren und außerhalb des Browsers aufbewahren. Wiederherstellung ersetzt alle vorhandenen Daten nach Bestätigung.

Ein Workout enthält Übungsnamen-Snapshots und Sätze. Vorlagen sind getrennte Datensätze mit eigenem Status; beim Start wird unabhängig kopiert. Nur abgeschlossene Sätze zählen zum Volumen, nur abgeschlossene Workouts zur Statistik. 0 kg kann für Körpergewichtsübungen verwendet werden; leere Werte bleiben null.

## Screenshot-Import

Unter Training → Screenshot importieren bis zu acht PNG-, JPEG- oder WebP-Dateien (je maximal 15 MB) auswählen. HEIC muss vorher als JPEG exportiert werden. Reihenfolge kann geändert werden. Tesseract lädt beim ersten Einsatz Worker und Sprachressourcen von externen CDNs; die Bilder werden nicht übertragen. Der Parser erkennt einfache Zeilen wie `1 20,5 kg x 10`. Ergebnisse müssen vollständig geprüft werden; andere Tabellenlayouts können manuelle Korrektur benötigen. Erst „Workout speichern“ schreibt einen regulären Workout-Datensatz atomar.

## Offline und iPhone

Die App einmal online vollständig öffnen. Der Service Worker speichert die Anwendung. Danach funktionieren lokale Trainingsfunktionen ohne Internet. OCR-Ressourcen werden zusätzlich gecacht; Offline-OCR ist hier noch nicht praktisch verifiziert. iOS garantiert keine Timer-Ausführung oder Benachrichtigung im Hintergrund. Beim Wiederöffnen wird die Restzeit aus dem gespeicherten Endzeitpunkt berechnet.

Installation: HTTPS-Adresse in Safari öffnen → Teilen → Zum Home-Bildschirm → Hinzufügen. Safe-Areas werden berücksichtigt. Tests auf einem echten iPhone 16 stehen aus.

## GitHub

Im Projektverzeichnis:

```sh
git add .
git commit -m "Implement SET workout PWA"
git branch -M main
git remote add origin https://github.com/DEIN-NAME/SET.git
git push -u origin main
```

Vorher ein leeres GitHub-Repository erstellen. Falls bereits ein Remote existiert, dessen URL prüfen statt erneut hinzuzufügen. `.env*`, Build-Ausgaben und Abhängigkeiten sind ausgeschlossen. Es wurden keine Zugangsdaten angelegt.

## Vercel

GitHub-Repository in Vercel importieren. Framework Vite, Build `npm run build`, Ausgabe `dist`, Install `npm install`. Root Directory auf das Projektverzeichnis setzen. `vercel.json` enthält SPA-Rewrites mit ausgenommenem API-Pfad. Nach Deployment die HTTPS-Adresse öffnen und Installation sowie Offline-Verhalten überprüfen. Es wurde kein Deployment ausgeführt.

## Optionale KI

Noch nicht implementiert. Der Button erklärt den fehlenden Konfigurationsstatus und lädt keine Bilder hoch. Es gibt keinen Provider, keine Schlüssel und keinen serverseitigen Erkennungsendpunkt. Die Kernanwendung benötigt keine KI. Eine sichere Erweiterung benötigt Upload-Einwilligung, serverseitige Provider-Schnittstelle, strikte Antwortvalidierung, Zeitlimit sowie verteiltes Rate-Limiting und Missbrauchsschutz vor Aktivierung.

## Tests und aktueller Abnahmestand

`npm test`: acht Vitest-Tests für leeren Start, Volumenberechnung, IndexedDB-Wiederöffnung, Backup-Roundtrip, Ablehnung defekter Backups, historische Namen, OCR-Zahlen und fehlende Werte. `npm run build` erfolgreich mit Bundle-Größenwarnung. Der Testumfang deckt nicht die vollständige geforderte Abnahmematrix ab.

Noch offen: echte Browser-/iPhone- und Offline-Abnahme, RTL-Interaktionstests, praktische OCR-Erkennung mit Screenshots, automatische englische/fuzzy Übungszuordnung, sichere Duplikat-/Konflikterkennung mehrerer Screenshots, Konfidenz je Wert, optionale KI, explizite PWA-Update-Oberfläche, durchschnittliche Trainingsdauer in Statistik und weitergehende Modularisierung. Die erste Datenbankversion hat noch keine spätere Migration zu testen.

Diese Ausgabe ist ein funktionsfähiger Grundstand, keine vollständige Erfüllung der umfangreichen SET-Abnahmekriterien.
