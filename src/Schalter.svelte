<script lang="ts">
	// Ein/Aus als Schalter: auf dem iPhone (Safari ab 17.4) der echte iOS-Schalter (`switch`, ab iOS 18
	// mit leichtem Ruckeln beim Umschalten), sonst ein gleich aussehender nachgebauter. Die ganze
	// Zeile ist tippbar.
	import type { Snippet } from 'svelte';

	let {
		checked = $bindable(false),
		onchange,
		children
	}: {
		checked?: boolean;
		onchange?: (an: boolean) => void;
		children: Snippet;
	} = $props();
</script>

<label class="schalter">
	<span class="wachsen">{@render children()}</span>
	<input
		type="checkbox"
		role="switch"
		{...{ switch: true }}
		bind:checked
		onchange={() => onchange?.(checked)}
	/>
</label>

<style>
	.schalter {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 48px;
		cursor: pointer;
	}

	/* Nachgebaut (ohne `switch`): Spur mit Knauf */
	input {
		flex: none;
		appearance: none;
		-webkit-appearance: none;
		width: 51px;
		height: 31px;
		margin: 0;
		border-radius: var(--radius-rund, 999px);
		background:
			radial-gradient(circle at 15.5px 50%, #ffffff 12.5px, transparent 13px), var(--rand-stark);
		cursor: pointer;
		transition: background-color var(--dauer-antwort, 0.15s) var(--feder, ease);
	}

	input:checked {
		background:
			radial-gradient(circle at calc(100% - 15.5px) 50%, #ffffff 12.5px, transparent 13px),
			var(--gruen);
	}

	input:focus-visible {
		outline: 3px solid var(--akzent);
		outline-offset: 2px;
	}

	/* Safari mit echtem Schalter: den des Systems nehmen (in der Farbe der App) */
	@supports selector(::thumb) {
		input {
			appearance: auto;
			-webkit-appearance: auto;
			width: auto;
			height: auto;
			background: none;
			accent-color: var(--gruen);
		}

		input:checked {
			background: none;
		}
	}
</style>
