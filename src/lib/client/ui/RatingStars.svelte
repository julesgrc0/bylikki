<script lang="ts">
	let {
		rating,
		count = null,
		size = 15
	}: { rating: number; count?: number | null; size?: number } = $props();

	const rounded = $derived(Math.round(rating));
</script>

<span class="inline-flex items-center gap-1.5" aria-label={`Note : ${rating} sur 5`}>
	<span class="tracking-[0.14em] text-pink" style="font-size:{size}px" aria-hidden="true">
		{'★'.repeat(rounded)}<span class="text-ink/25">{'★'.repeat(5 - rounded)}</span>
	</span>
	{#if count !== null}
		<span class="text-[12.5px] text-ink/55">{count} avis</span>
	{/if}
</span>
