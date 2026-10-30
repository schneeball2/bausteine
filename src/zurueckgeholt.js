// Wann zuletzt etwas mit „Rückgängig“ zurückkam: Nur dann gleitet eine Zeile auf (WischZeile) –
// beim Laden einer Liste stehen die Zeilen einfach da.
let zuletzt = -Infinity;

/** Aufrufen, wenn „Rückgängig“ etwas zurückholt */
export function zurueckgeholt() {
	zuletzt = performance.now();
}

/** Kam gerade (vor weniger als 1,5 s) etwas zurück? */
export function geradeZurueckgeholt() {
	return performance.now() - zuletzt < 1500;
}
