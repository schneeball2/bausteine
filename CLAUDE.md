# Bausteine – Bauregeln

Gemeinsame Bausteine für `schneeball2/reise-app` und `schneeball2/kniffelblock` (dort gelten deren
CLAUDE.md, Texte und Bezeichner auf Deutsch). Öffentlich: nie Daten, Adressen, Schlüssel.

- Kein Build: Svelte-Dateien und JavaScript (mit JSDoc und `.d.ts`) werden so ausgeliefert, die Apps
  übersetzen selbst. Keine Abhängigkeiten außer `svelte` (peer).
- Jede Änderung mit neuer `version` (Semver); die Apps heben den Stand (Commit) per Pull Request an und
  testen dort mit ihren Klicktests (Chromium und WebKit) – hier gibt es nur `npm run check` und
  `npm run lint`.
- Verhalten nicht still ändern: Was eine App heute tut, bleibt Standard; Neues über Optionen.
