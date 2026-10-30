<script module lang="ts">
	/** Nur eine Zeile ist offen: Schließen der zuletzt geöffneten (über alle Listen) */
	let offeneSchliessen: (() => void) | null = null;

	/** Was man nach langem Drücken mit der Zeile tun kann */
	export interface Aktion {
		text: string;
		/** Rot (Löschen) */
		rot?: boolean;
		tun: () => void;
	}
</script>

<script lang="ts">
	// Listenzeile mit Wischen zum Löschen wie auf dem iPhone: nach links wischen zeigt rotes
	// „Löschen“; ganz durchwischen oder auf „Löschen“ tippen löscht (die Seite zeigt dazu
	// „Rückgängig“). Mit `durchwischen={false}` löscht nur das Tippen auf „Löschen“ – weiter
	// Gewischtes federt zurück auf den Knopf (für Zeilen, an denen viel hängt, z. B. eine ganze
	// Liste). Senkrecht scrollen bleibt frei: Nach ein paar Pixeln steht die Richtung fest,
	// senkrecht übernimmt der Browser (touch-action: pan-y). Nur eine Zeile ist offen; Tippen
	// daneben oder auf die offene Zeile schließt sie. Nur mit dem Finger – Löschen geht immer auch
	// auf der Detailseite. Die Zeile reicht bis an den Rand der Karte (`einzug` = Innenabstand der
	// Liste); Trennlinien zwischen den Zeilen zieht der Baustein selbst. Ein Griff zum Ziehen in der
	// Zeile (SortierListe) startet kein Wischen. Mit `menue` öffnet langes Drücken (oder Rechtsklick)
	// ein Menü der App mit „Öffnen“ (erster Link der Zeile) und Löschen. Kommt eine Zeile kurz nach
	// `zurueckgeholt()` (zurueckgeholt.js) neu in die Liste, gleitet sie auf. Farben aus der App:
	// `--wisch-flaeche` (sonst `--karte`), `--wisch-linie` (sonst `--rand`), `--wisch-rot`.
	import { onDestroy, type Snippet } from 'svelte';
	import { geradeZurueckgeholt } from './zurueckgeholt.js';

	let {
		onloeschen,
		text = 'Löschen',
		einzug = 16,
		durchwischen = true,
		breite = 88,
		menue,
		children
	}: {
		/** Löschen wie auf der Detailseite (mit „Rückgängig“) */
		onloeschen: () => void | Promise<void>;
		/** Beschriftung des roten Knopfs */
		text?: string;
		/** Innenabstand der Liste links und rechts in px */
		einzug?: number;
		/** Ganz durchwischen löscht; false: Wischen zeigt nur „Löschen“, gelöscht wird mit Tippen */
		durchwischen?: boolean;
		/** Breite des roten Knopfs (für längere Beschriftung als „Löschen“) */
		breite?: number;
		/** Menü nach langem Drücken (z. B. ein Blatt der App); ohne: kein langes Drücken */
		menue?: Snippet<[{ aktionen: Aktion[]; zu: () => void }]>;
		children: Snippet;
	} = $props();

	/** Breite des Knopfs, so weit bleibt eine offene Zeile stehen */
	// svelte-ignore state_referenced_locally
	const KNOPF = breite;
	/** So lange gedrückt (ohne zu bewegen) öffnet das Menü */
	const LANG = 500;
	/** Ab so vielen Pixeln steht die Richtung fest */
	const RICHTUNG_AB = 8;
	/** Weiter als dieser Anteil der Breite gewischt: löschen */
	const DURCH = 0.6;

	let wurzel: HTMLDivElement;
	let vorne: HTMLDivElement;
	let versatz = $state(0);
	let zieht = $state(false);
	let offen = $state(false);
	let weg = $state(false);
	/** Weit genug gewischt: Loslassen löscht – Rot füllt die Zeile, der Name wandert mit */
	let bereit = $state(false);
	/** Nach dem Löschen klappt die Zeile zusammen (Höhe in px während des Zusammenklappens) */
	let hoehe = $state<number | null>(null);
	/** Gleitet gerade zurück: Rot bleibt dahinter, bis die Zeile wieder steht */
	let schliesst = $state(false);

	let start: { x: number; y: number; id: number; basis: number } | null = null;
	let richtung: '' | 'waagerecht' | 'senkrecht' = '';
	/** Klick nach dem Wischen (oder nach Tippen auf die offene Zeile) nicht als Öffnen werten */
	let schluckenBis = 0;
	/** Kurz nach einem Wischen: auch ein Klick auf „Löschen“ ist nur das Loslassen, kein Tippen */
	let wischEnde = 0;
	/** Inhalt nimmt kein Tippen an: solange offen und bis der Klick danach vorbei ist */
	let gesperrt = $state(false);
	let druck: ReturnType<typeof setTimeout> | undefined;
	/** „Öffnen“ im Menü, wenn die Zeile ein Link ist */
	let hatLink = $state(false);
	let mitMenue = $state(false);
	let entsperren: ReturnType<typeof setTimeout> | undefined;

	const ruhig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	/** Kommt eine Zeile mit „Rückgängig“ zurück, gleitet sie auf (beim Laden nicht) */
	function einblenden(knoten: HTMLElement) {
		if (ruhig() || !geradeZurueckgeholt()) return { duration: 0 };
		const h = knoten.offsetHeight;
		return {
			duration: 200,
			css: (t: number) => `height: ${t * h}px; opacity: ${t}; overflow: hidden`
		};
	}

	function oeffnen() {
		if (offeneSchliessen && offeneSchliessen !== schliessen) offeneSchliessen();
		offeneSchliessen = schliessen;
		offen = true;
		versatz = -KNOPF;
		clearTimeout(entsperren);
		gesperrt = true;
	}

	function schliessen() {
		if (offeneSchliessen === schliessen) offeneSchliessen = null;
		schliesst = versatz < 0 && !ruhig();
		// Falls „transitionend“ ausbleibt (z. B. Zeile gerade verdeckt)
		if (schliesst) setTimeout(() => (schliesst = false), 400);
		offen = false;
		versatz = 0;
		// Nach dem Tippen auf die offene Zeile kommt der Klick erst noch – bis dahin gesperrt
		const rest = schluckenBis - performance.now();
		clearTimeout(entsperren);
		if (rest > 0) entsperren = setTimeout(() => (gesperrt = false), rest);
		else gesperrt = false;
	}

	async function loeschen() {
		if (weg) return;
		weg = true;
		if (offeneSchliessen === schliessen) offeneSchliessen = null;
		versatz = -wurzel.offsetWidth;
		if (!ruhig()) {
			await new Promise((fertig) => setTimeout(fertig, 180));
			// Zusammenklappen, damit die Liste nicht springt
			hoehe = wurzel.offsetHeight;
			await new Promise((fertig) => requestAnimationFrame(() => fertig(null)));
			hoehe = 0;
			await new Promise((fertig) => setTimeout(fertig, 200));
		}
		try {
			await onloeschen();
		} catch {
			// Nicht gelöscht: die Zeile klappt wieder auf und gleitet zurück
			bereit = false;
			if (hoehe !== null) {
				hoehe = wurzel.scrollHeight;
				await new Promise((fertig) => setTimeout(fertig, 200));
			}
			hoehe = null;
			weg = false;
			schliessen();
		}
	}

	function runter(e: PointerEvent) {
		// Hat ein Element in der Zeile den Finger schon genommen (Griff der SortierListe ruft
		// preventDefault), wischt die Zeile nicht
		if (e.pointerType === 'mouse' || !e.isPrimary || weg || e.defaultPrevented) return;
		start = { x: e.clientX, y: e.clientY, id: e.pointerId, basis: offen ? -KNOPF : 0 };
		richtung = '';
		// Lange drücken: Menü – nicht in Feldern (dort markiert das iPhone Text) und nicht offen
		clearTimeout(druck);
		const ziel = e.target as Element;
		if (menue && !offen && !ziel.closest('input, textarea, select, [contenteditable]')) {
			const id = e.pointerId;
			druck = setTimeout(() => {
				if (!start || start.id !== id || richtung) return;
				start = null;
				menueOeffnen();
			}, LANG);
		}
	}

	function bewegen(e: PointerEvent) {
		if (!start || e.pointerId !== start.id) return;
		const dx = e.clientX - start.x;
		const dy = e.clientY - start.y;
		if (!richtung) {
			if (Math.abs(dx) < RICHTUNG_AB && Math.abs(dy) < RICHTUNG_AB) return;
			richtung = Math.abs(dx) > Math.abs(dy) ? 'waagerecht' : 'senkrecht';
			clearTimeout(druck);
			if (richtung === 'senkrecht') {
				start = null;
				if (offen) schliessen();
				return;
			}
			if (offeneSchliessen && offeneSchliessen !== schliessen) offeneSchliessen();
			zieht = true;
			try {
				vorne.setPointerCapture(e.pointerId);
			} catch {
				// schon losgelassen – dann eben ohne
			}
		}
		const roh = start.basis + dx;
		// Ohne Durchwischen geht es über den Knopf hinaus nur zäh weiter (federt beim Loslassen zurück)
		const weit = durchwischen ? roh : roh < -KNOPF ? -KNOPF + (roh + KNOPF) / 3 : roh;
		versatz = Math.min(0, Math.max(-wurzel.offsetWidth, weit));
		bereit = durchwischen && versatz < -wurzel.offsetWidth * DURCH;
	}

	function menueOeffnen() {
		// Das Loslassen danach ist kein Tippen auf die Zeile
		schluckenBis = performance.now() + 1500;
		hatLink = !!wurzel.querySelector('.inhalt a[href]');
		// Das Blatt entsteht erst, wenn es gebraucht wird (lange Listen bleiben schlank)
		mitMenue = true;
	}

	/** Langes Drücken, wo der Browser es selbst meldet (Chrome), und Rechtsklick am Computer */
	function kontextmenue(e: MouseEvent) {
		if (!menue || weg || offen || richtung === 'waagerecht') return;
		if ((e.target as Element).closest('input, textarea, select, [contenteditable]')) return;
		e.preventDefault();
		clearTimeout(druck);
		start = null;
		menueOeffnen();
	}

	function hoch(e: PointerEvent) {
		clearTimeout(druck);
		if (!start || e.pointerId !== start.id) return;
		start = null;
		if (richtung !== 'waagerecht') {
			// Getippt, während die Zeile offen ist: nur schließen
			if (offen && !richtung) {
				schluckenBis = performance.now() + 600;
				schliessen();
			}
			return;
		}
		zieht = false;
		schluckenBis = performance.now() + 600;
		wischEnde = performance.now() + 300;
		// „bereit“ bleibt beim Löschen stehen: der Name gleitet am Finger mit hinaus
		if (durchwischen && versatz < -wurzel.offsetWidth * DURCH) void loeschen();
		else {
			bereit = false;
			if (versatz < -KNOPF / 2) oeffnen();
			else schliessen();
		}
	}

	function abbrechen(e: PointerEvent) {
		clearTimeout(druck);
		if (!start || e.pointerId !== start.id) return;
		start = null;
		if (richtung === 'waagerecht') {
			zieht = false;
			bereit = false;
			if (offen) oeffnen();
			else schliessen();
		}
	}

	function klick(e: MouseEvent) {
		// Endet ein Wischen über „Löschen“, darf das Loslassen nicht als Tippen darauf zählen – sonst
		// löschte weites Wischen auch dort, wo nur Tippen löschen soll (durchwischen={false})
		const nachWischen = performance.now() < wischEnde;
		wischEnde = 0;
		if (
			nachWischen ||
			(performance.now() < schluckenBis && !(e.target as Element).closest('.loeschen'))
		) {
			e.preventDefault();
			e.stopPropagation();
		}
		schluckenBis = 0;
		if (!offen) {
			clearTimeout(entsperren);
			gesperrt = false;
		}
	}

	// Offen: Tippen irgendwo anders schließt (auch der Anfang eines Scrollens)
	$effect(() => {
		if (!offen) return;
		const draussen = (e: PointerEvent) => {
			if (!wurzel.contains(e.target as Node)) schliessen();
		};
		const taste = (e: KeyboardEvent) => {
			if (e.key === 'Escape') schliessen();
		};
		document.addEventListener('pointerdown', draussen, true);
		document.addEventListener('keydown', taste);
		return () => {
			document.removeEventListener('pointerdown', draussen, true);
			document.removeEventListener('keydown', taste);
		};
	});

	onDestroy(() => {
		if (offeneSchliessen === schliessen) offeneSchliessen = null;
		clearTimeout(entsperren);
		clearTimeout(druck);
	});

	const aktionen: Aktion[] = $derived([
		...(hatLink
			? [
					{
						text: 'Öffnen',
						tun: () => {
							schluckenBis = 0;
							wurzel.querySelector<HTMLAnchorElement>('.inhalt a[href]')?.click();
						}
					}
				]
			: []),
		{ text, rot: true, tun: () => void loeschen() }
	]);
</script>

<!-- Wischen ist eine Abkürzung für den Finger; Tastatur und VoiceOver löschen auf der Detailseite -->
<div
	class="wisch"
	class:klappt={hoehe !== null}
	style:--einzug="{einzug}px"
	style:height={hoehe === null ? undefined : `${hoehe}px`}
	bind:this={wurzel}
	onclickcapture={klick}
	in:einblenden
>
	{#if versatz < 0 || offen || schliesst}
		<div class="hinten">
			<button
				type="button"
				class="loeschen"
				class:bereit
				style:width="{Math.max(KNOPF, -versatz)}px"
				tabindex={offen ? 0 : -1}
				aria-hidden={!offen}
				onclick={() => void loeschen()}>{text}</button
			>
		</div>
	{/if}
	<div
		class="vorne"
		class:zieht
		style:transform={versatz ? `translateX(${versatz}px)` : undefined}
		bind:this={vorne}
		ontransitionend={() => (schliesst = false)}
		onpointerdown={runter}
		onpointermove={bewegen}
		onpointerup={hoch}
		onpointercancel={abbrechen}
		oncontextmenu={kontextmenue}
		role="presentation"
	>
		<!-- Offen trifft ein Tippen die Zeile selbst, nicht Feld, Link oder Knopf darin: es schließt nur
		     (ein Textfeld bekäme sonst den Fokus, das iPhone zeigte die Tastatur) -->
		<div class="inhalt" style:pointer-events={gesperrt ? 'none' : undefined}>
			{@render children()}
		</div>
	</div>
</div>

{#if mitMenue && menue}{@render menue({
		aktionen,
		zu: () => {
			mitMenue = false;
			// Zu ohne Auswahl: das nächste Tippen auf die Zeile gilt wieder
			schluckenBis = 0;
		}
	})}{/if}

<style>
	.wisch {
		position: relative;
		overflow: hidden;
		margin-inline: calc(-1 * var(--einzug));
	}

	.hinten {
		position: absolute;
		inset: 0;
		display: flex;
		justify-content: flex-end;
		background: var(--wisch-rot, #b3261e);
	}

	.loeschen {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		color: #fff;
		font: inherit;
		font-size: 16px;
		font-weight: 700;
		white-space: nowrap;
		cursor: pointer;
	}

	/* Weit genug: „Löschen“ steht am Finger (links im Rot) – loslassen löscht */
	.loeschen.bereit {
		justify-content: flex-start;
		padding-left: 24px;
	}

	/* Gelöscht: die Zeile klappt zusammen, statt dass die Liste springt */
	.wisch.klappt {
		transition: height 0.2s ease;
	}

	.vorne {
		position: relative;
		padding-inline: var(--einzug);
		background: var(--wisch-flaeche, var(--karte));
		/* Senkrecht scrollt der Browser, waagerecht wischt die Zeile; langes Drücken öffnet unser Menü,
		   nicht die Vorschau des Links */
		touch-action: pan-y;
		-webkit-touch-callout: none;
		transition: transform 0.22s ease;
	}

	.vorne.zieht {
		transition: none;
		user-select: none;
		-webkit-user-select: none;
	}

	/* Trennlinie zwischen den Zeilen, eingerückt wie in den Listen */
	.wisch:not(:first-child) .inhalt {
		border-top: 1px solid var(--wisch-linie, var(--rand));
	}

	@media (prefers-reduced-motion: reduce) {
		.vorne {
			transition: none;
		}
	}
</style>
