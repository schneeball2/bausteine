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
"@schneeball2/bausteine": "github:schneeball2/bausteine#v0.1.0"
```

Immer auf eine Version (Tag). Ein Fix: hier ändern, neuen Tag, dann in jeder App die Version anheben –
mit eigenem Pull Request und Klicktests dort.

Farben kommen aus der App: `--wisch-flaeche`, `--wisch-linie`, `--wisch-rot` (sonst `--karte`,
`--rand`, ein festes Rot).
