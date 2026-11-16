# Bausteine

Gemeinsame Svelte-Bausteine für die eigenen Apps von Thomas (Reise-App, Kniffelblock und künftige).
Nur Bedienelemente – keine Daten, keine Schlüssel.

| Baustein                                   | Wofür                                                                |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `@schneeball2/bausteine/WischZeile.svelte` | Listenzeile: nach links wischen zeigt „Löschen“, durchwischen löscht |
| `@schneeball2/bausteine/herunterziehen`    | Blatt von unten zum Herunterziehen (Svelte-Attachment)               |
| `@schneeball2/bausteine/zurueckgeholt`     | „Rückgängig“ melden: die zurückgeholte Zeile gleitet auf             |
| `@schneeball2/bausteine/test/wischen`      | Gesten für Klicktests (Playwright): wischen, drücken, ziehen, zoomen |

## Einbinden

```json
"@schneeball2/bausteine": "github:schneeball2/bausteine#<commit>"
```

Immer auf einen festen Stand (ganze Commit-Prüfsumme; Tags kann Claude aus der Sitzung nicht pushen).
Ein Fix: hier ändern, `version` in `package.json` anheben, dann in jeder App den Stand anheben – mit
eigenem Pull Request und Klicktests dort.

`WischZeile` mit `pruefen` (seit 0.2.0): vor dem Löschen, solange die Zeile noch steht – `false`
lässt sie zurückgleiten (z. B. „steht noch in Ausgaben“ oder eine Rückfrage, die mit ✕ endet).

Farben kommen aus der App: `--wisch-flaeche`, `--wisch-linie`, `--wisch-rot` (sonst `--karte`,
`--rand`, ein festes Rot).

Bewegung kommt aus der App, wenn sie welche hat (seit 0.3.0): `--dauer-klein` und `--feder` für das
Gleiten von `WischZeile` und `herunterziehen` (sonst wie bisher 0,2 s bzw. 0,22 s und `ease`). Die
Wartezeiten im Skript rechnen mit 0,2 s – `--dauer-klein` bleibt deshalb bei 0,2 s.

Seit 0.4.0 auch (aus der Reise-App, in Tricount gleich): `ZweiSpalten` (Grenze `BREIT_AB` in
`zweispalten`; unten bis `--ueber-leiste` bzw. `--ueber-unten`), `InfoKnopf` (Rahmen der Blase
`--infoknopf-rand`), `Schalter`, `HeldAngabe` und `weitergeben` (`weitergebenMit(zeigeHinweis)` gibt
`kopieren` und `teilen` mit dem Hinweis der App). Größen, Ecken und Dauern kommen aus den Tokens der
App (`--groesse-…`, `--radius-…`, `--dauer-…`, `--feder`), ohne sie gelten die bisherigen Werte.
