# SET

Mobile-first Workout-PWA mit React, TypeScript, Vite, Tailwind, Dexie/IndexedDB, React Router, Recharts, date-fns. Monochrome Oberfläche; keine Accounts, Werbung oder vorbefüllte Trainingshistorie.

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
- JSON-Backup mit Schema-Prüfung, Vorschau durch Bestätigungsdialog und transaktionaler vollständiger Wiederherstellung.
- Manifest, Workbox-Service-Worker und Hantel-Icons für installierbare PWA.

## Datenspeicherung und Backup

Alle Workouts, Vorlagen, Definitionen und Einstellungen liegen in IndexedDB im Browser. Kein Server erhält Trainingsdaten. Browserdaten können vom Nutzer oder Betriebssystem gelöscht werden. Regelmäßig unter Einstellungen ein JSON-Backup exportieren und außerhalb des Browsers aufbewahren. Wiederherstellung ersetzt alle vorhandenen Daten nach Bestätigung.

Ein Workout enthält Übungsnamen-Snapshots und Sätze. Vorlagen sind getrennte Datensätze mit eigenem Status; beim Start wird unabhängig kopiert. Nur abgeschlossene Sätze zählen zum Volumen, nur abgeschlossene Workouts zur Statistik. 0 kg kann für Körpergewichtsübungen verwendet werden; leere Werte bleiben null.

## Offline und iPhone

Die App einmal online vollständig öffnen. Der Service Worker speichert die Anwendung. Danach funktionieren lokale Trainingsfunktionen ohne Internet. iOS garantiert keine Timer-Ausführung oder Benachrichtigung im Hintergrund. Beim Wiederöffnen wird die Restzeit aus dem gespeicherten Endzeitpunkt berechnet.

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

GitHub-Repository in Vercel importieren. Framework Vite, Build `npm run build`, Ausgabe `dist`, Install `npm install`. Root Directory auf das Projektverzeichnis setzen. `vercel.json` enthält SPA-Rewrites mit ausgenommenem API-Pfad. Nach Deployment die HTTPS-Adresse öffnen und Installation sowie Offline-Verhalten überprüfen. Die App ist unter https://set-workout.vercel.app bereitgestellt.

## Funktionsumfang

Die Screenshot-Erkennung einschließlich lokaler OCR und KI-Schaltfläche wurde auf Nutzerwunsch entfernt. Bereits gespeicherte Workouts bleiben reguläre Trainingsdaten. JSON-Backup-Import und -Export sind weiterhin verfügbar. Alte `/import`-Links führen zur Trainingsseite.

## Tests und aktueller Abnahmestand

`npm test`: sechs Vitest-Tests für leeren Start, Volumenberechnung, IndexedDB-Wiederöffnung, Backup-Roundtrip, Ablehnung defekter Backups, historische Namen. `npm run build` erfolgreich mit Bundle-Größenwarnung. Der Testumfang deckt nicht die vollständige geforderte Abnahmematrix ab.

Noch offen: echte Browser-/iPhone- und Offline-Abnahme, RTL-Interaktionstests, explizite PWA-Update-Oberfläche, durchschnittliche Trainingsdauer in Statistik und weitergehende Modularisierung. Die erste Datenbankversion hat noch keine spätere Migration zu testen.

Diese Ausgabe ist ein funktionsfähiger Grundstand, keine vollständige Erfüllung der umfangreichen SET-Abnahmekriterien.

## SET 2.0 – Visual Preview

Die visuelle Überarbeitung liegt auf `feat/set-2-visual-identity`. Die Datenbank bleibt auf Version 1; vorhandene Trainings werden nicht migriert oder zurückgesetzt.

Unter **Training → Deine Push- & Pull-Vorlagen** lassen sich die vom Nutzer bereitgestellten Pläne prüfen und mit einem Klick ergänzen (Push: 10 Übungen/29 Sätze, Pull: 8 Übungen/22 Sätze). Die Übernahme ist atomar und überschreibt keine vorhandenen Einträge. Erneutes Klicken erzeugt keine Duplikate. Körpergewicht ohne Zusatzgewicht bleibt `null`. Abweichende Satzpausen bei Tricep Pushdown und Bicep Curl stehen in den Übungsnotizen, da das bestehende Modell nur eine Pause pro Übung unterstützt. Hier verwendet der Timer weiterhin die eingestellte Standardpause.

**Einstellungen → Auf Updates prüfen** prüft die veröffentlichte PWA. Neue Service Worker können alte Offline-Versionen ablösen; eine offene Trainingsansicht wird nicht automatisch neu geladen. „Update öffnen“ bzw. „Ansicht neu laden“ verlangt eine Bestätigung. Vorher die laufende Eingabe abschließen und auf „Gespeichert“ warten. Kein Löschen von Browserdaten erforderlich.

Zusätzliche Browserprüfungen:

```sh
npx playwright install chromium
npm run test:ui
npm run test:pwa
```

Alternativ einen vorhandenen Chromium über `CHROMIUM_PATH=/usr/bin/chromium` auswählen. Die Skripte starten lokale Testserver und verwenden isolierte Browserprofile. `test:pwa` prüft den Wechsel von einer alten gecachten Version, Datenerhalt, Backup und Offline-Reload. Chromium-Tests ersetzen keine Prüfung auf einem echten iPhone/iPad mit Safari.
