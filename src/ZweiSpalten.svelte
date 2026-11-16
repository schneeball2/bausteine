<script lang="ts">
	// Zwei Spalten auf breiten Bildschirmen (ab 1000 px, iPad quer): links `links`, rechts `rechts`,
	// der `kopf` (Titel der Seite) über rechts – mit `fest` steht links still (sticky, volle Höhe bis
	// über die Leiste, z. B. die Karte) und nur rechts scrollt, sonst über beiden Spalten.
	// Schmaler (iPhone, iPad hochkant) sind alle Hüllen `display: contents`: Kopf, links, rechts
	// stehen untereinander in der Seite wie ohne diesen Baustein – nichts verschiebt sich.
	// Die Grenze steht auch in zweispalten.js (BREIT_AB, für Seiten, die breit anderes zeigen) –
	// gleich halten. Gemeinsam für Reise-App und Tricount (Repo bausteine): unten bis über die
	// Leiste (`--ueber-leiste`) bzw. das Schwebende (`--ueber-unten`) der App.
	import type { Snippet } from 'svelte';

	let {
		kopf,
		links,
		rechts,
		fest = false
	}: {
		kopf?: Snippet;
		/** Ohne `links` bleibt die Seite einspaltig (z. B. ohne Reise oder Gruppe) */
		links?: Snippet;
		rechts?: Snippet;
		/** Links steht still in voller Höhe (Karte), rechts scrollt die Seite */
		fest?: boolean;
	} = $props();
</script>

<div class="zwei-spalten" class:geteilt={!!links} class:fest>
	{#if kopf}<div class="spalte-kopf">{@render kopf()}</div>{/if}
	{#if links}<div class="spalte-links">{@render links()}</div>{/if}
	<div class="spalte-rechts">{@render rechts?.()}</div>
</div>

<style>
	.zwei-spalten,
	.spalte-kopf,
	.spalte-links,
	.spalte-rechts {
		display: contents;
	}

	@media (min-width: 1000px) {
		/* Die Seite darf breiter werden als --inhalt-max */
		:global(.seite:has(> .zwei-spalten.geteilt)) {
			max-width: var(--breit-max);
		}

		.zwei-spalten.geteilt {
			display: grid;
			grid-template-columns: minmax(0, 1fr) min(560px, 46%);
			grid-template-rows: auto 1fr;
			grid-template-areas: 'kopf kopf' 'links rechts';
			gap: 16px 24px;
			align-items: start;
		}

		.zwei-spalten.geteilt.fest {
			grid-template-areas: 'links kopf' 'links rechts';
		}

		.geteilt > .spalte-kopf,
		.geteilt > .spalte-links,
		.geteilt > .spalte-rechts {
			display: flex;
			flex-direction: column;
			gap: 16px;
			min-width: 0;
		}

		/* Was auf dem iPhone bis an den Rand reicht (Filter), endet hier an der Spalte */
		.geteilt > .spalte-rechts {
			--rand-seite: 0px;
		}

		.spalte-kopf {
			grid-area: kopf;
		}

		.spalte-links {
			grid-area: links;
		}

		.spalte-rechts {
			grid-area: rechts;
		}

		/* Steht still: oben wie der Inhalt (unter dem kleinen Titel, wenn er steht), unten bis über die
		   Leiste; was darin liegt, füllt die Spalte (die Karte über --karte-hoehe) */
		.fest > .spalte-links {
			--spalte-oben: calc(env(safe-area-inset-top, 0px) + 20px + var(--titelleiste, 0px));
			position: sticky;
			top: var(--spalte-oben);
			height: calc(100dvh - var(--spalte-oben) - var(--ueber-leiste, var(--ueber-unten, 0px)));
			border-radius: var(--radius, 22px);
			overflow: hidden;
			/* Erscheint der kleine Titel, rückt die Karte weich darunter statt zu springen */
			transition:
				top var(--dauer-klein, 0.2s) var(--feder, ease),
				height var(--dauer-klein, 0.2s) var(--feder, ease);
		}

		@media (prefers-reduced-motion: reduce) {
			.fest > .spalte-links {
				transition: none;
			}
		}

		.zwei-spalten.fest > .spalte-links > :global(*) {
			--karte-hoehe: 100%;
			flex: 1;
			min-height: 0;
			margin: 0;
		}
	}
</style>
