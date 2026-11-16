// Weitergeben – ein Weg für Kopieren und Teilen (gemeinsam für Reise-App und Tricount). Den Hinweis
// („… kopiert“) zeigt die App: `weitergebenMit(zeigeHinweis)` gibt `kopieren` und `teilen` mit ihm.

/**
 * In die Zwischenablage. Ein Versprechen geht auch: Safari schreibt nur direkt nach dem Tippen –
 * dann bekommt die Zwischenablage den Inhalt als Versprechen, während er noch entsteht (z. B. ein
 * neuer Link vom Server). Wirft, wenn es nicht geht.
 * @param {string | Promise<string>} inhalt
 * @returns {Promise<void>}
 */
export async function inZwischenablage(inhalt) {
	if (
		typeof inhalt !== 'string' &&
		typeof ClipboardItem !== 'undefined' &&
		navigator.clipboard?.write
	) {
		const blob = inhalt.then((text) => new Blob([text], { type: 'text/plain' }));
		await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
		return;
	}
	await navigator.clipboard.writeText(await inhalt);
}

/**
 * Inhalt markieren (dann „Kopieren“ im Menü des iPhones)
 * @param {HTMLElement} feld
 */
function markieren(feld) {
	const auswahl = window.getSelection();
	if (!auswahl) return false;
	const bereich = document.createRange();
	bereich.selectNodeContents(feld);
	auswahl.removeAllRanges();
	auswahl.addRange(bereich);
	return true;
}

/**
 * Kann das Gerät teilen (Teilen-Menü: AirDrop, Nachricht …)?
 * @returns {boolean}
 */
export function teilenGeht() {
	return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Kann das Gerät so eine Datei teilen? Mit einer winzigen Probedatei – nicht den Inhalt kopieren
 * @param {string} name
 * @param {string} typ
 * @returns {boolean}
 */
export function dateiTeilenGeht(name, typ) {
	try {
		return !!navigator.canShare?.({ files: [new File([new Uint8Array(1)], name, { type: typ })] });
	} catch {
		return false;
	}
}

/**
 * Datei ins Teilen-Menü (AirDrop, Nachricht …). Ohne `await` davor aufrufen: Safari erlaubt Teilen
 * nur direkt nach dem Tippen. Abbrechen im Menü ist kein Fehler.
 * @param {File} datei
 * @param {string} titel
 */
export async function teilenDatei(datei, titel) {
	try {
		await navigator.share({ files: [datei], title: titel });
	} catch {
		// Abgebrochen oder nicht erlaubt: nichts zu melden
	}
}

/**
 * Kopieren und Teilen mit dem Hinweis der App.
 * @param {(text: string) => void} zeigeHinweis
 */
export function weitergebenMit(zeigeHinweis) {
	/**
	 * Kopieren mit Hinweis „<was> kopiert“. Geht es nicht und steht der Text sichtbar da (`feld`), wird
	 * er markiert; sonst ein Hinweis, es noch einmal zu versuchen. → ob kopiert wurde
	 * @param {string} inhalt
	 * @param {string} was
	 * @param {HTMLElement} [feld]
	 * @returns {Promise<boolean>}
	 */
	async function kopieren(inhalt, was, feld) {
		try {
			await inZwischenablage(inhalt);
			zeigeHinweis(`${was} kopiert`);
			return true;
		} catch {
			if (feld && markieren(feld))
				zeigeHinweis(`${was} markiert – zum Kopieren antippen und halten`);
			else zeigeHinweis('Kopieren hat nicht geklappt. Bitte noch einmal antippen.');
			return false;
		}
	}

	/**
	 * Teilen-Menü öffnen; ohne Teilen kopieren (Text und Link zusammen, auch nur ein Text). Abbrechen
	 * im Menü ist kein Fehler.
	 * @param {{ url?: string; text?: string; title?: string }} daten
	 * @param {string} [was]
	 */
	async function teilen(daten, was = 'Link') {
		if (!teilenGeht()) {
			await kopieren([daten.text, daten.url].filter(Boolean).join('\n'), was);
			return;
		}
		try {
			await navigator.share(daten);
		} catch {
			// Abgebrochen oder nicht erlaubt: nichts zu melden
		}
	}

	return { kopieren, teilen };
}
