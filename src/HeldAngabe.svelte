<script lang="ts">
	// Eine Angabe im Fuß der `HeldKarte`: Marke in Großbuchstaben („WANN“), darunter der Wert
	import type { Snippet } from 'svelte';

	let { marke, children }: { marke: string; children: Snippet } = $props();
</script>

<span class="angabe"><span class="marke">{marke}</span>{@render children()}</span>

<style>
	.angabe {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.marke {
		font-family: var(--schrift-mono);
		font-size: var(--groesse-12, 12px);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.85;
	}
</style>
