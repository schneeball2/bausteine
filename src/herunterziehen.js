// Blatt von unten zum Herunterziehen wie auf dem iPhone: am Griff oben (Zeigerereignisse, der Griff
// braucht `touch-action: none`) oder mit dem Finger irgendwo, solange das Blatt ganz oben steht –
// nicht aus Feldern heraus (Text markieren) und nicht aus `ausnahmen` (z. B. waagerecht scrollende
// Tabellen). Weit genug gezogen (ein Viertel der Höhe, mindestens 80 px) oder schnell geschnippt
// (über 30 px) schließt es, sonst federt es zurück. `fest`: folgt dem Finger nur zäh und bleibt.
// `darfZu` fragt erst beim Loslassen (z. B. „Änderungen verwerfen?“). Nur Finger und Stift, keine
// Maus – am Computer schließt Tippen daneben.

const ohneBewegung = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Als Svelte-Attachment: `{@attach herunterziehen({ … })}` am Blatt.
 * @param {import('./herunterziehen.d.ts').HerunterziehenOptionen} o
 * @returns {(blatt: HTMLElement) => () => void}
 */
export function herunterziehen(o) {
	return (blatt) => {
		let startY = 0;
		let letzteY = 0;
		let letzteZeit = 0;
		let tempo = 0;
		let zieht = false;
		let entschieden = false;
		const fest = () => o.fest?.() ?? false;

		/** @param {number} dy @param {boolean} gleiten */
		function setzen(dy, gleiten) {
			blatt.style.transition = gleiten && !ohneBewegung() ? 'transform 0.2s ease-out' : 'none';
			const weg = fest() ? dy / 4 : dy;
			blatt.style.transform = weg > 0 ? `translateY(${weg}px)` : '';
		}

		/** @param {number} y */
		function beginnen(y) {
			startY = letzteY = y;
			letzteZeit = performance.now();
			tempo = 0;
			zieht = false;
			entschieden = false;
		}

		/** @param {number} y */
		function bewegen(y) {
			const jetzt = performance.now();
			tempo = (y - letzteY) / Math.max(1, jetzt - letzteZeit);
			letzteY = y;
			letzteZeit = jetzt;
			const dy = y - startY;
			if (!entschieden) {
				if (Math.abs(dy) < 8) return false;
				entschieden = true;
				zieht = dy > 0;
			}
			if (zieht) setzen(dy, false);
			return zieht;
		}

		function loslassen() {
			if (!zieht) return;
			zieht = false;
			const dy = letzteY - startY;
			const weit = dy > Math.max(80, blatt.offsetHeight / 4) || (tempo > 0.6 && dy > 30);
			if (weit && !fest() && (o.darfZu?.() ?? true)) {
				setzen(blatt.offsetHeight, true);
				const zu = () => {
					o.schliessen();
					// Bleibt das Blatt (z. B. <dialog>), steht es beim nächsten Öffnen wieder oben
					blatt.style.transition = 'none';
					blatt.style.transform = '';
				};
				if (ohneBewegung()) zu();
				else setTimeout(zu, 200);
			} else {
				setzen(0, true);
			}
		}

		// Am Griff: Zeigerereignisse (der Griff lässt den Browser nicht scrollen)
		const griff = o.griff() ?? null;
		/** @param {PointerEvent} e */
		function griffRunter(e) {
			if (e.pointerType === 'mouse') return;
			e.preventDefault();
			try {
				griff?.setPointerCapture(e.pointerId);
			} catch {
				// nachgespielte Zeiger (Klicktests in WebKit) lassen sich nicht festhalten
			}
			beginnen(e.clientY);
		}
		/** @param {PointerEvent} e */
		const griffBewegen = (e) => {
			if (e.pointerType !== 'mouse' && letzteZeit) bewegen(e.clientY);
		};
		const griffHoch = () => {
			loslassen();
			letzteZeit = 0;
		};
		griff?.addEventListener('pointerdown', griffRunter);
		griff?.addEventListener('pointermove', griffBewegen);
		griff?.addEventListener('pointerup', griffHoch);
		griff?.addEventListener('pointercancel', griffHoch);

		// Sonst mit dem Finger, solange das Blatt oben steht
		const nicht = ['input, textarea, select, [contenteditable]', o.ausnahmen]
			.filter(Boolean)
			.join(', ');
		let fingerAktiv = false;
		/** @param {TouchEvent} e */
		function fingerRunter(e) {
			const ziel = /** @type {Element} */ (e.target);
			fingerAktiv =
				e.touches.length === 1 &&
				blatt.scrollTop <= 0 &&
				!griff?.contains(ziel) &&
				!ziel.closest(nicht);
			if (fingerAktiv) beginnen(e.touches[0].clientY);
		}
		/** @param {TouchEvent} e */
		function fingerBewegen(e) {
			if (!fingerAktiv) return;
			if (bewegen(e.touches[0].clientY)) e.preventDefault();
			else if (entschieden) fingerAktiv = false;
		}
		function fingerHoch() {
			if (fingerAktiv) loslassen();
			fingerAktiv = false;
		}
		blatt.addEventListener('touchstart', fingerRunter, { passive: true });
		blatt.addEventListener('touchmove', fingerBewegen, { passive: false });
		blatt.addEventListener('touchend', fingerHoch);
		blatt.addEventListener('touchcancel', fingerHoch);

		return () => {
			griff?.removeEventListener('pointerdown', griffRunter);
			griff?.removeEventListener('pointermove', griffBewegen);
			griff?.removeEventListener('pointerup', griffHoch);
			griff?.removeEventListener('pointercancel', griffHoch);
			blatt.removeEventListener('touchstart', fingerRunter);
			blatt.removeEventListener('touchmove', fingerBewegen);
			blatt.removeEventListener('touchend', fingerHoch);
			blatt.removeEventListener('touchcancel', fingerHoch);
		};
	};
}
