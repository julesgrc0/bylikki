<script lang="ts">
	let {
		page,
		pageCount,
		onselect
	}: { page: number; pageCount: number; onselect: (page: number) => void } = $props();

	/** Fenetre glissante de cinq pages autour de la page courante. */
	const pages = $derived.by(() => {
		const start = Math.max(1, Math.min(page - 2, pageCount - 4));
		const end = Math.min(pageCount, start + 4);

		return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
	});
</script>

{#if pageCount > 1}
	<nav class="flex flex-wrap items-center justify-center gap-2.5" aria-label="Pagination">
		<button
			onclick={() => onselect(page - 1)}
			disabled={page <= 1}
			class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
		>
			←
		</button>

		{#each pages as candidate (candidate)}
			<button
				onclick={() => onselect(candidate)}
				aria-current={candidate === page ? 'page' : undefined}
				class="min-w-[44px] cursor-pointer rounded-[40px] border-[1.5px] border-ink px-4 py-2.5 text-[14px] font-semibold {candidate ===
				page
					? 'bg-pink text-white'
					: 'hover:bg-pink-pale'}"
			>
				{candidate}
			</button>
		{/each}

		<button
			onclick={() => onselect(page + 1)}
			disabled={page >= pageCount}
			class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
		>
			→
		</button>
	</nav>
{/if}
