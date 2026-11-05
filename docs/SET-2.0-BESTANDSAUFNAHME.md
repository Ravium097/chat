# SET 2.0 — Schritt 0 und Freigabeplan

Stand: 2026-11-05. Geprüfter Ausgangscommit: `81b1062`.
Status: ausschließlich Bestandsaufnahme; Phase 1 wartet auf Freigabe. Kein Deployment.

## Sicherheitsbasis

- Repository `/workspace/chat`, Remote `Ravium097/chat`, aktueller Branch `work`.
- Arbeitsbaum vor der Bestandsaufnahme sauber, keine vorhandenen uncommitteten Arbeiten.
- Sicherheits-Branch `safety/set-2.0-baseline` und annotierter Tag `set-2.0-baseline-2026-11-05` lokal auf `81b1062` angelegt. Kein Checkout, kein Push, keine Änderung bestehender Branches.
- Diese Dokumentation ist die einzige neu angelegte Projektdatei. Build-Ausgaben unter `dist/` sind ignoriert.
- Git sichert Quellcode, keine IndexedDB-Daten auf dem iPad. Kein Zugriff auf oder Export der persönlichen Trainingsdaten erfolgt.
- Vor späteren datenrelevanten Änderungen: JSON-Backup auf dem tatsächlichen Gerät exportieren und Datei sichern. Eine Wiederherstellung nur in isolierter Testumgebung prüfen, nie ungefragt über Nutzerdaten.

## Tatsächlicher Bestand

| Bereich | Implementierung |
| --- | --- |
| Stack | React 19, TypeScript strict, Vite 7, Tailwind 4 über Vite-Plugin; React Router 7, Lucide, Dexie 4 + dexie-react-hooks, Recharts 3, date-fns 4, Zod 4. Versionbereiche und Lockfile vorhanden. |
| Struktur | `src/main.tsx` enthält App-Shell, alle Seiten, gemeinsame Eingaben und zahlreiche DB-Aktionen. `src/data.ts` vereint Schemas, DB, Initialisierung, Grundberechnungen und Backup. Kein Backend. |
| Design | `src/style.css`: überwiegend globale Selektoren, hart codierte Farben/Abstände, Kartenradius 18 px, Navigation 40 px; keine systematischen CSS-Tokens. Systemschrift mit Inter-Fallback, keine gebündelte Inter-/Geist-Datei. Tabellarische Ziffern bislang vor allem bei Metriken. |
| Navigation | `/`, `/training`, `/workout/:wid`, `/library`, `/history`, `/stats`, `/settings`. `/import` leitet mit replace nach `/training`. Keine eigene 404-Ansicht. |
| App-Shell | Viewport-Gitter mit `100dvh`, scrollbarem `main`, eigenem Dock für Timer und Navigation; Safe-Area-Abstände und Scroll-Reset bei Routenwechsel. Kompakte leere Übersichten. |
| Dashboard | Datum, Workoutanzahl, Gesamtvolumen, aktuelle Woche, letztes Workout, Start/Fortsetzen; keine Beispielhistorie. |
| Training | Freies Workout; Vorlagen erstellen, bearbeiten, duplizieren, starten und im Editor löschen. Vorlagenstart kopiert Übungen/Sätze mit neuen IDs. |
| Editor | Name, Datum, Daueranzeige, Satzanzahl/Volumen; aufklappbare Übungsbereiche, manuelle Eingaben, Gewichtsschritt 2,5 kg, Wiederholungsschritt 1, null für leere Werte, Komma/Punkt, Satzstatus, Hinzufügen/Löschen, Übung nach oben verschieben. Gemeinsamer Editor für aktive, abgeschlossene und Vorlagen-Datensätze. |
| Bibliothek | 13 initiale Übungsdefinitionen; Suche, Muskel-/Gerätefilter, Favoriten, Erstellen/Bearbeiten/Löschen, Notizen und individuelle Pausenzeit. Auch Standarddefinitionen editier- und löschbar. |
| Historie | Monatswechsel, Montag als Wochenbeginn, Trainingstage, Tagesliste und Detail-/Bearbeitungsroute. |
| Statistik | Zeitraum 30/90/365 Tage oder Gesamt; Volumen/Häufigkeit pro Woche/Monat; maximales Übungsgewicht pro Einheit; Gewichts-, Wiederholungs- und Satzvolumenrekorde im gewählten Zeitraum. Noch keine Vorher-Nachher-Insights, kein Report, keine durchschnittliche Dauer. |
| Daten | IndexedDB `SET`, Dexie-Version 1, Tabellen `exercises`, `workouts`, `settings`. Status `active/completed/template` trennt Workouts und Vorlagen in derselben Tabelle. Übungen und Sätze sind eingebettete Arrays. Namen werden im Workout als Snapshot gespeichert. Keine späteren Versionen oder Upgrade-Migrationen. |
| Autosave | `Editor.save` schreibt jeweils das gesamte Workout mit `put`; `useLiveQuery` aktualisiert Anzeigen. Aktive Workouts werden per Status gefunden und wieder geöffnet. |
| Timer | Endzeitstempel oder pausierte Restzeit in Settings; Intervall dient Anzeige, Restzeit basiert auf aktueller Uhrzeit. Automatischer Start, Übungspause, Pause/Weiter, +30 s, Schließen. Workoutabschluss setzt Timer in derselben Transaktion zurück. |
| Screenshot/OCR | Auf ausdrücklichen Nutzerwunsch im Ausgangscommit entfernt, einschließlich Tesseract, KI-Button, Parser und Runtime-Caching. Nicht wieder einführen. Bereits importierte Workouts sind normale Daten und bleiben erhalten. |
| Backup | JSON-Export über konsistente Lesetransaktion, App-/Schema-Version und Exportdatum. Restore: Zod-Prüfung, eindeutige Top-Level-IDs und maximal eine aktive Session; vollständiger Ersatz erst nach Bestätigung in RW-Transaktion. Timer wird beim Restore bewusst zurückgesetzt. Dateilimit 20 MB. |
| PWA | vite-plugin-pwa/Workbox, generiertes Manifest und Service Worker, Standalone, PNG/SVG-/Apple-Icons, statisches Precaching. Update-Modus `prompt`, aber kein sichtbarer Update-Dialog. Keine OCR-/CDN-Runtime-Regeln mehr. |
| Tests/CI | Eine Vitest-Datei mit sechs Tests und fake-indexeddb. RTL/jsdom installiert, aber keine eingecheckten UI-, E2E- oder visuellen Tests. Keine `.github`-CI-Konfiguration gefunden. |

## Verifikation dieser Bestandsaufnahme

Tatsächlich ausgeführt:

- `npm run typecheck`: erfolgreich, `tsc --noEmit`.
- `npm test`: 6/6 erfolgreich; leerer Start, Volumen abgeschlossener Sätze, Wiederöffnung der DB, Backup-Roundtrip, Ablehnung fehlerhaften Backups ohne Löschen, Erhalt historischer Übungsnamen.
- `npm run build`: erfolgreich, inklusive TypeScript-Prüfung und Service-Worker-Erzeugung.
- Bestehende Buildwarnungen: Zod-PURE-Kommentare; JS-Hauptbundle ca. 896,53 kB (gzip 270,31 kB), über 500-kB-Warnschwelle.

Weitere vorhandene Skripte: `npm run dev` (Vite), `npm run preview` (Vite Preview). Kein Lint-/E2E-Skript vorhanden. Diese beiden Serverbefehle wurden in Schritt 0 nicht erneut gestartet.

Nicht in Schritt 0 ausgeführt: echte iPhone/iPad-Safari- und Standalone-Abnahme, Bildschirmtastatur, Offline-/Updatewechsel, Speicherdruck, UI-Backup-Download auf iOS, vollständiger Restore mit komplexen Bestandsdaten, visuelle Regression. Die sechs Tests verwenden nur eine simulierte IndexedDB, keine persönlichen Browserdaten.

## Wichtigste Risiken — bestehender Zustand, nicht stillschweigend beheben

1. **Autosave und parallele Aktionen:** Vollständige Datensatz-Snapshots statt feldweiser atomarer Aktualisierung; keine Schreibwarteschlange/Versionsprüfung. Schnelle Änderungen oder mehrere Tabs können theoretisch neuere Felder überschreiben. Workoutstart prüft nur den geladenen UI-Zustand; kein atomarer Schutz gegen Doppelstart. Im Audit nicht als reproduzierter Datenverlust behauptet.
2. **Backup-Validierung:** Datum ist nur String mit Mindestlänge, keine Kalenderprüfung; verschachtelte IDs/Relationen und Wertegrenzen nicht umfassend geprüft. Vorhandener Export/Roundtrip ist ein Sicherheitsnetz, keine vollständige Restore-Zertifizierung. Keine Schemaänderung in Phase 1.
3. **Statistik-Semantik:** Übungsentwicklung gruppiert nach Namen statt stabiler Übungs-ID. Gleichnamige Übungen können zusammenfallen, Umbenennungen Verläufe trennen. Fehlende Werte werden bei Volumen/Rekorden teilweise als 0 gerechnet. Zeitraumfilter mischt Date-Parsing und lokale Wochenzuordnung; Randfälle/Zeitzonen sind ungetestet.
4. **UI-Kopplung:** Mehr als 1.000 Zeilen in main.tsx, globale CSS-Regeln und nachträgliche Overrides. Große JSX-Umbauten könnten versehentlich Handler oder Eingabezustand verändern.
5. **Mobile Ergonomie:** Plus/Minus teilweise nur 24–28 px breit, Checkbox 24 px; Symbolaktionen nicht überall sinnvoll beschriftet. 44-px-Ziele erfordern sorgfältige Rasterprüfung bei schmalen Geräten. Shell-/Keyboardverhalten darf nicht durch neue Höhenregeln regressieren.
6. **Fehler-/Loading-Zustände:** Viele direkte DB-Aufrufe ohne einheitliche Fehlerbehandlung. Nicht gefundene Workout-ID bleibt bei „wird geladen“. Native alert/confirm sind nicht individuell gestaltbar. Datenbank-Initialisierung bei fehlenden Settings legt Standardübungen neu an.
7. **PWA:** Keine bedienbare Update-Aufforderung trotz prompt-Modus; alter Offline-Stand kann länger aktiv bleiben. Browser können lokale Daten entfernen. Kein Nachweis garantierter iOS-Hintergrundausführung.
8. **Testlücken:** Keine eingecheckten Interaktionstests für Autosave, Timer, Vorlagenkopie, Statistikänderungen und mobile Layouts; historische manuelle Browserchecks ersetzen keine reproduzierbare Suite.

## Phase 1 — konkreter Plan zur Freigabe

Ziel: ausschließlich Visual Identity. Keine neue Trainingsfunktion, kein Focus Mode, keine neuen Insights, keine Änderung an Datenmodellen oder Speicher-/Berechnungslogik.

### 1. Gemeinsame Grundlage

- `src/styles/tokens.css`: Farben (#F5F5F2/#111111/#737373/#FFFFFF), neutrale Linien, Abstände, Radien 4/6/8/10 px, Schriftgrößen, Fokuszustände.
- Inter als lokale WOFF2 einschließlich Lizenzhinweisen, sofern sinnvoll beschaffbar; System-Fallback. Keine externen Font-Requests. System-Monospace für technische Labels, tabellarische Ziffern für Trainingswerte.
- Kleine rein präsentative Komponenten in `src/components/ui/` für Seitenkopf, Abschnitte, Metriken und Buttons. Keine DB-Imports, neue State-Verwaltung oder Umorganisation des gesamten Projekts. Native Semantik, bestehende Callbacks und stabile Eingabeschlüssel erhalten.
- Globale Styles schrittweise durch gezielte Klassen ersetzen. Das bestehende Viewport-/Dock-Konzept bleibt bestehen.

### 2. Screens in vorgegebener Reihenfolge

1. Dashboard: SET-Wortmarke und „PRECISION IN EVERY REP.“; offene Metrikzeile, präzise Trennlinien, ein dominanter Start/Fortsetzen-Button, letztes Workout. Kompakt halten.
2. Navigation: monochromes Dock, kleinere Radien, klare aktive Markierung; gleiche vier Ziele. Timer bleibt im reservierten Bereich.
3. Training: technische Typografie und Satzraster, ruhige Flächen, klarer Abschlussstatus. Keine Änderungen an Schritten, Parsing, Satzreihenfolge oder Saves; besondere aktive-Satz-Logik bleibt Phase 2 vorbehalten.
4. Bibliothek: offene Übungszeilen und Filter; sämtliche Aktionen und Felder behalten.
5. Vorlagen: kompakte Zeilen mit unveränderten Start-/Bearbeiten-/Duplizieren-/Löschen-Aktionen.
6. Historie: präzises Kalenderraster und Tagesliste; Monats- und Datumsberechnung unverändert.
7. Statistik: bestehende Recharts direkt sichtbar, Schrift/Raster/Achsen und Abstände vereinheitlichen; weder Werte noch Zeiträume ändern. Empty State ohne Fake-Kurven.
8. Screenshot-Import: entfällt im tatsächlichen Bestand; Redirect bleibt erhalten. JSON-Import bleibt in Einstellungen.
9. Einstellungen: gegliederte Abschnitte für Timer, Backup und Informationen; destruktive Aktionen klar getrennt. Native Sicherheitsdialoge bleiben funktional unverändert. Ihr Ersatz durch eigene Dialoge wäre ein gesondert freizugebender Interaktionsumbau, nicht Teil dieses strikt visuellen Plans.

### 3. Betroffene und geschützte Dateien

Geplant: `src/style.css`, neue `src/styles/tokens.css`, kleine UI-Komponenten, Präsentations-JSX in `src/main.tsx`, gegebenenfalls lokale Schrift-/Lizenzdateien. Nur Farbangaben in `index.html` und PWA-Manifestkonfiguration anpassen; Caching und Updateverhalten bleiben gleich. Relevante UI-Testdateien ergänzen, keine vorhandenen Tests entfernen.

Unverändert: `src/data.ts`, DB-Name/Version/Tabellen, Schemas, ID-Erzeugung, Statusmodell, Save-/Start-/Abschluss-/Timer-/Restore-Handler, Statistikformeln, Routen, Backup-Format, vorhandene Daten und Übungen, vercel.json. Kein Frameworkwechsel, kein neues Backend, keine neue zustandsführende Architektur.

### 4. Verifikation und Abnahme

- Nach jedem abgegrenzten UI-Teil relevante Checks; am Ende Typecheck, alle bestehenden und ergänzten Tests, Produktionsbuild.
- Vorher-/Nachher-Screenshots in isoliertem Browser mit expliziten Testdaten: leer, aktives Workout, Vorlage, Historie und gefüllte Statistik. Testdaten ausschließlich in getrenntem Testprofil, niemals Produktionsdaten befüllen.
- Mobile Breiten 320/375/393/430 px, iPad 820 px, Desktop und Querformat; kein horizontaler Overflow, lange Namen, große Zahlen und vergrößerte Schrift prüfen.
- Primäre Touch-Ziele mindestens 44×44 px; Fokus, Beschriftungen und Reduced Motion prüfen. Notwendiges vertikales Scrollen bei langen Listen/größerer Schrift zulassen, keine abgeschnittenen Inhalte.
- Navigations-/Timer-Dock beim Scrollen und Routewechsel prüfen; kompakte leere Hauptansichten erhalten.
- Smoke-Flows mit identischen Erwartungen vor/nach Redesign: freie Session, Vorlagenstart, Satzänderung und Reload, Satzabschluss/Timer, Workoutabschluss/Historie, JSON-Export/Restore im Testprofil.
- Echter iPad-/iPhone-Safari-Test bleibt gesonderte Geräteabnahme; Chromium-Viewporttests nicht als iOS-Nachweis ausgeben.

## Freigabepunkt

Phase 1 erst nach ausdrücklicher Freigabe dieses Plans beginnen. Keine automatischen Folgephasen. Keine produktive Bereitstellung ohne erneute ausdrückliche Deployment-Freigabe.
