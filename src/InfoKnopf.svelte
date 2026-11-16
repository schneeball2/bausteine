<script lang="ts">
	// Erklärung hinter ⓘ: Tippen zeigt eine kurze Notiz als Blase unter dem Knopf, Tippen daneben
	// oder Escape schließt sie (Popover, liegt über allem – keine Karte schneidet sie ab). Statt
	// Erklärsätzen unter Feldern und Karten. Rahmen der Blase aus der App (`--infoknopf-rand`).
	let { text, titel = 'Info' }: { text: string; titel?: string } = $props();

	const id = $props.id();
	let knopf: HTMLButtonElement | undefined = $state();
	let blase: HTMLElement | undefined = $state();
	let auf = $state(false);
	/** Scrollen gleich nach dem Öffnen (z. B. noch vom Antippen) schließt nicht */
	let geoeffnet = 0;

	/**
	 * Unter den Knopf legen, ist unten zu wenig Platz darüber – immer im Bildschirm (16 px Rand).
	 * Scrollen oder Drehen schließt (die Blase liegt fest, sie wanderte sonst nicht mit).
	 */
	function legen(ereignis: Event) {
		const neu = (ereignis as ToggleEvent).newState === 'open';
		auf = neu;
		if (!neu || !knopf || !blase) return;
		geoeffnet = performance.now();
		const k = knopf.getBoundingClientRect();
		const breite = Math.min(280, window.innerWidth - 32);
		const links = Math.min(
			Math.max(16, k.left + k.width / 2 - breite / 2),
			window.innerWidth - 16 - breite
		);
		blase.style.width = `${breite}px`;
		blase.style.left = `${links}px`;
		blase.style.top = '0px';
		blase.style.visibility = 'hidden';
		requestAnimationFrame(() => {
			if (!blase || !knopf) return;
			const hoehe = blase.offsetHeight;
			const unten = window.innerHeight - 100;
			const oben = k.bottom + 6 + hoehe <= unten ? k.bottom + 6 : Math.max(16, k.top - 6 - hoehe);
			blase.style.top = `${oben}px`;
			blase.style.visibility = '';
		});
	}

	function schliessen(ereignis: Event) {
		if (ereignis.type === 'scroll' && performance.now() - geoeffnet < 400) return;
		if (auf) blase?.hidePopover();
	}

	// Zu beim Scrollen (auch im Blatt), Drehen und wenn die Blase verschwindet (Blatt zu)
	$effect(() => {
		if (!auf) return;
		window.addEventListener('scroll', schliessen, { capture: true, passive: true });
		window.addEventListener('resize', schliessen);
		const dialog = knopf?.closest('dialog');
		dialog?.addEventListener('close', schliessen);
		return () => {
			window.removeEventListener('scroll', schliessen, { capture: true });
			window.removeEventListener('resize', schliessen);
			dialog?.removeEventListener('close', schliessen);
		};
	});
	$effect(() => () => {
		try {
			blase?.hidePopover();
		} catch {
			// schon zu
		}
	});
</script>

<button
	class="info"
	type="button"
	bind:this={knopf}
	popovertarget={id}
	aria-label={titel}
	aria-expanded={auf}
>
	<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8" />
		<path d="M12 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		<circle cx="12" cy="7.6" r="1.2" fill="currentColor" />
	</svg>
</button>
<div class="blase" {id} popover="auto" role="note" bind:this={blase} onbeforetoggle={legen}>
	{text}
</div>

<style>
	.info {
		position: relative;
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		margin: -8px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--text-3);
		cursor: pointer;
		touch-action: manipulation;
	}

	/* Tippziel mindestens 44 px, das Symbol bleibt klein */
	.info::after {
		content: '';
		position: absolute;
		inset: -6px -4px;
	}

	.info[aria-expanded='true'] {
		color: var(--akzent);
	}

	.blase {
		position: fixed;
		inset: auto;
		margin: 0;
		padding: 12px 14px;
		border: var(--infoknopf-rand, 1px solid var(--rand));
		border-radius: var(--radius-klein, 14px);
		background: var(--karte);
		color: var(--text-2);
		box-shadow: var(--schatten-hoch);
		font-size: var(--groesse-14, 14px);
		line-height: 1.4;
	}

	@media (prefers-reduced-motion: no-preference) {
		.blase:popover-open {
			animation: auftauchen var(--dauer-klein, 0.2s) var(--feder, ease-out);
		}
	}

	@keyframes auftauchen {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}
</style>
