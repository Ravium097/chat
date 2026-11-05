# SET 2.0 – Phase 1 / Visual Preview

## Umfang

Freigegebene Phase 1 plus ausdrücklich gewünschte Update-Korrektur und Push-/Pull-Vorlagen aus den neun Screenshots. Keine weiteren Roadmap-Phasen umgesetzt. Keine Produktionsbereitstellung.

- Gemeinsame Swiss-Editorial-Tokens, lokales Inter inklusive Lizenz, technische Labels, kompakte Flächen und konsistente mobile Eingaben.
- Dashboard, Training, Bibliothek, Vorlagen, Kalender, Statistik, Einstellungen erhalten gemeinsame Gestaltung. Native Bestätigungsdialoge bleiben bestehen.
- Navigation und Timer in eigenem Dock außerhalb des scrollenden Inhalts. Safe Areas, reduzierte Bewegung und Tastaturfokus berücksichtigt.
- Kontrollierter Updatehinweis und manuelles Neuladen. Service Worker aktiviert neue Ressourcen, ohne offene Seite automatisch neu zu laden oder IndexedDB zu löschen.
- Screenshot-OCR bleibt entfernt; alte Import-Route leitet weiter. Die neuen persönlichen Vorlagen sind manuell aus den bereitgestellten Screenshots übertragen.
- Vorlagenübernahme ist ausdrücklich, additiv, atomar und gegen mehrfaches Anlegen abgesichert. Keine abgeschlossenen Trainings angelegt.
- Workout-Links erhalten zugängliche Namen; der Browserablauftest deckte deren bisher fehlende Screenreader-Beschriftung auf.

## Dateien

`src/styles/tokens.css`, `src/style.css`, `src/components/ui/Identity.tsx`, `src/components/pwa/UpdateControl.tsx`, `src/components/templates/PersonalTemplates.tsx`, `src/services/personalTemplates.ts`, `src/main.tsx`, `src/vite-env.d.ts`, `public/fonts/*`, `index.html`, `vite.config.ts`, `package.json`, Lockfile, neue Tests und `scripts/check-*.cjs`, README.

## Geschützt / unverändert

`src/data.ts` und bestehende Datentests unverändert. Keine DB-Versionierung, Tabellenänderung, Migration oder Änderung bestehender Statistik-, Autosave-, Timer- und Restore-Berechnungen. Bestehende Benutzerdaten werden nicht angefasst. Sicherheitsbranch und Ausgangstag bleiben erhalten.

## Grenzen und Risiken

- Abweichende Satzpausen sind nur als Notiz darstellbar: Tricep Pushdown 02:20/01:30/01:30, Bicep Curl 02:10/01:30/01:30. Timer verwendet bei diesen Übungen die Standardpause. Keine stillschweigende Schemaerweiterung.
- Reale iOS-Geräte, installierte Homescreen-PWA und Bildschirmtastatur wurden hier nicht getestet. Browsergrößen sind kein Safari-Nachweis.
- Bestehendes Autosave schreibt komplette Workout-Snapshots; sehr schnelle konkurrierende Änderungen benötigen in Phase 2 gezielte Prüfung und ggf. separate Korrektur.
- Bestehendes großes JS-Bundle führt weiterhin zu Vite-Größenwarnung; Zod-Kommentaranmerkungen sind nicht fatal.
- Persönliche Vorlagen sind nach Veröffentlichung auf jedem Gerät einmal über Training zu übernehmen. Lokale Gerätedaten sind getrennt.

## Freigabe

Produktionsdeployment erst nach ausdrücklicher Nutzerfreigabe gemäß Roadmap Regel 11. Nächste Phase separat freigeben.

## Ausgeführte Verifikation

- `npm run typecheck`: erfolgreich.
- `npm test`: 13/13 Tests erfolgreich, einschließlich drei neuer Vorlagentests (Werte, Idempotenz/Datenerhalt, Transaktions-Rollback).
- `npm run build`: erfolgreich; Workbox precacht 12 Ressourcen. Nicht fatale Bundle-/Zod-Warnungen wie oben dokumentiert.
- `CHROMIUM_PATH=/usr/bin/chromium node scripts/check-ui.cjs`: erfolgreich. Sieben Routen auf sechs Viewports (320, 375, 393, 430, 820, 1180 px); kein horizontaler Overflow, Dock bleibt stehen. Vollständiger Vorlagen-/Training-/Timer-/Reload-/Abschluss-/Backup-Restore-Ablauf sowie persönliche Vorlagenübernahme und Reload erfolgreich.
- `CHROMIUM_PATH=/usr/bin/chromium node scripts/check-pwa-update.cjs`: erfolgreich. Alte Offline-Version ersetzt, kein erzwungener Seitenreload, gespeichertes Testworkout unverändert, JSON-Export und Offline-Reload erfolgreich.
- `git diff --check`: erfolgreich. Bestehende Datendatei und Datentests unverändert.

Nicht ausgeführt: echter iPhone-/iPad-Safari-Test, produktives Deployment, produktive Datenzugriffe. Testdaten ausschließlich in isolierten Profilen.
