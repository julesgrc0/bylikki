<script lang="ts">
	import { ui } from '#lib/client/state/shop.svelte';
	import { formatPrice } from '#lib/client/utils/money';
	import { suggest } from '#lib/remote/product.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let term = $state('');
	let input = $state<HTMLInputElement | null>(null);

	/** La suggestion ne part qu'a partir de deux caracteres, pour ne pas surcharger. */
	const suggestions = $derived(term.trim().length >= 2 ? suggest(term.trim()) : null);

	$effect(() => {
		if (ui.searchOpen) {
			input?.focus();
		}
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const query = term.trim();

		ui.closeAll();
		await goto(resolve(`/search?query=${encodeURIComponent(query)}`));
	}

	async function pick(slug: string) {
		ui.closeAll();
		term = '';
		await goto(resolve('/[slug]', { slug }));
	}
</script>

<div
	class="fixed inset-0 z-[64] transition-opacity duration-200 {ui.searchOpen
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
>
	<button
		aria-label="Fermer la recherche"
		onclick={() => ui.closeAll()}
		class="absolute inset-0 cursor-default bg-ink/35"
	></button>

	<div class="relative mx-auto mt-0 w-full max-w-[720px] px-4 pt-4 sm:pt-16">
		<form
			onsubmit={submit}
			class="flex items-center gap-3 rounded-[24px] border-2 border-ink bg-paper px-5 py-4 shadow-[10px_12px_0_rgba(46,27,51,.16)]"
		>
			<span class="text-[20px]" aria-hidden="true">⌕</span>
			<input
				bind:this={input}
				bind:value={term}
				type="search"
				name="query"
				placeholder="Chercher un collier, une trousse, une couleur…"
				aria-label="Rechercher un produit"
				class="flex-1 bg-transparent text-[17px] text-ink outline-none"
			/>
			<button type="submit" class="cursor-pointer text-[14px] font-semibold text-pink">
				Rechercher
			</button>
		</form>

		{#if suggestions}
			{#await suggestions then results}
				{#if results.length > 0}
					<ul
						class="mt-3 flex list-none flex-col overflow-hidden rounded-[20px] border-2 border-ink bg-paper p-0 shadow-[10px_12px_0_rgba(46,27,51,.12)]"
					>
						{#each results as result (result.slug)}
							<li class="border-b-[1.5px] border-ink/10 last:border-b-0">
								<button
									onclick={() => pick(result.slug)}
									class="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-pink-pale"
								>
									<span class="text-[15.5px]">{result.name}</span>
									<span class="text-[14px] text-ink/60">{formatPrice(result.basePriceCents)}</span>
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-3 rounded-[20px] bg-paper px-5 py-4 text-[14.5px] text-ink/65">
						Aucune création ne correspond — essaie « collier », « trousse » ou une couleur.
					</p>
				{/if}
			{/await}
		{/if}
	</div>
</div>
