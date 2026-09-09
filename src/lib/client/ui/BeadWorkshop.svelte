<script lang="ts">
	import { beadPalette } from '#lib/client/data/content';
	import { strand } from '#lib/client/state/shop.svelte';
	import { resolve } from '$app/paths';
	import TornEdge from './TornEdge.svelte';
</script>

<TornEdge variant="b" color="#E9DFFF" />
<section class="relative bg-purple-soft px-5 pt-4 pb-10 lg:px-[70px] lg:pt-5 lg:pb-[78px]">
	<div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-[56px]">
		<div>
			<span class="text-[12px] font-semibold tracking-[0.16em] text-purple-ink uppercase">
				Personnalisation
			</span>
			<h2
				class="mt-3 mb-0 text-[26px] leading-[1.1] font-semibold lg:text-[48px] lg:leading-[1.02]"
			>
				Choisis tes perles →<br class="hidden lg:inline" /> assemble → crée ton bijou
			</h2>
			<p class="mt-4 mb-0 max-w-[420px] text-[15px] leading-[1.55] text-ink/75 lg:text-[16px]">
				Clique sur les perles pour composer ton collier. Dans la boutique, tu pourras aussi les
				faire glisser et changer le fermoir.
			</p>
			<div class="mt-5 flex flex-wrap items-center gap-3.5 lg:mt-[26px]">
				<a
					href={resolve('/search?query=personnalisable')}
					class="rounded-[40px] bg-ink px-[26px] py-3.5 text-[16px] text-cream hover:bg-ink/90"
				>
					Créer mon bijou →
				</a>
				<button
					onclick={() => strand.reset()}
					class="cursor-pointer border-b-[1.5px] border-ink/40 pb-0.5 text-[14px]"
				>
					Recommencer
				</button>
			</div>
		</div>

		<div
			class="rounded-[20px] border-2 border-ink bg-paper p-4 shadow-[10px_12px_0_rgba(169,139,245,.55)] lg:rounded-[28px] lg:p-[26px]"
		>
			<div
				class="flex flex-wrap items-center justify-between gap-2 text-[12px] tracking-[0.12em] text-ink/55 uppercase"
			>
				<span>Atelier — aperçu</span>
				<span class="font-hand text-[17px] tracking-normal text-pink normal-case">
					glisser-déposer à l’implémentation ✦
				</span>
				<span>{strand.beads.length} perles</span>
			</div>

			<div
				class="relative mt-3.5 flex h-[130px] items-center justify-center overflow-hidden lg:h-[170px]"
			>
				<svg
					viewBox="0 0 520 120"
					preserveAspectRatio="none"
					class="absolute inset-0 h-full w-full"
					aria-hidden="true"
				>
					<path
						d="M10,34C130,110 390,110 510,34"
						fill="none"
						stroke="#2E1B33"
						stroke-width="2"
						stroke-dasharray="4 5"
					/>
				</svg>
				<div class="relative flex max-w-full flex-wrap items-center justify-center gap-1.5 pt-6">
					{#each strand.beads as bead, i (`${bead}-${i}`)}
						<button
							onclick={() => strand.remove(i)}
							aria-label="Retirer cette perle"
							class="h-[30px] w-[30px] cursor-pointer rounded-full border-2 border-ink lg:h-[38px] lg:w-[38px]"
							style="background:{bead}"
						></button>
					{/each}
					{#if strand.beads.length === 0}
						<span class="font-hand text-[22px] text-ink/50">choisis une perle ci-dessous ↓</span>
					{/if}
				</div>
			</div>

			<div class="my-3.5 h-px bg-ink/12 lg:mt-2 lg:mb-[18px]"></div>

			<div class="flex flex-wrap justify-center gap-2 lg:justify-start lg:gap-3">
				{#each beadPalette as color (color)}
					<button
						onclick={() => strand.add(color)}
						aria-label="Ajouter cette perle"
						class="h-[38px] w-[38px] cursor-pointer rounded-full border-2 border-ink transition-transform hover:-translate-y-1 lg:h-[46px] lg:w-[46px]"
						style="background:{color}"
					></button>
				{/each}
			</div>
		</div>
	</div>
</section>
<TornEdge variant="b" color="#E9DFFF" flip />
