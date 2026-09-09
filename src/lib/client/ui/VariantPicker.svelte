<script lang="ts">
	import type { VariantData } from '#lib/client/types';
	import { formatPrice } from '#lib/client/utils/money';

	let {
		variants,
		selectedId = $bindable()
	}: { variants: VariantData[]; selectedId: string | undefined } = $props();
</script>

{#if variants.length > 1}
	<div>
		<div class="mb-2.5 text-[12px] tracking-[0.14em] text-ink/55 uppercase">Déclinaison</div>
		<div class="flex flex-wrap gap-2.5">
			{#each variants as variant (variant.id)}
				{@const soldOut = variant.stock <= 0}
				<button
					onclick={() => (selectedId = variant.id)}
					disabled={soldOut}
					aria-pressed={selectedId === variant.id}
					class="flex cursor-pointer items-center gap-2 rounded-[24px] border-[1.5px] border-ink px-5 py-2.5 text-[14px] transition-colors disabled:cursor-not-allowed disabled:opacity-40 {selectedId ===
					variant.id
						? 'bg-ink text-cream'
						: 'bg-transparent text-ink hover:bg-pink-pale'}"
				>
					{#each variant.attributeValues as entry (entry.attributeValue.attribute.key + entry.attributeValue.value)}
						{#if entry.attributeValue.attribute.kind === 'COLOR' && entry.attributeValue.hexColor}
							<span
								class="h-4 w-4 rounded-full border border-ink/40"
								style="background:{entry.attributeValue.hexColor}"
							></span>
						{/if}
					{/each}
					<span>{variant.label}</span>
					{#if soldOut}
						<span class="text-[12px]">épuisé</span>
					{/if}
				</button>
			{/each}
		</div>
	</div>
{/if}

{#each variants.filter((variant) => variant.id === selectedId) as variant (variant.id)}
	{#if variant.compareAtPriceCents && variant.compareAtPriceCents > variant.priceCents}
		<p class="m-0 text-[14px] text-ink/60">
			<span class="line-through">{formatPrice(variant.compareAtPriceCents)}</span>
			<span class="ml-2 font-semibold text-pink-deep">
				−{Math.round((1 - variant.priceCents / variant.compareAtPriceCents) * 100)} %
			</span>
		</p>
	{/if}
{/each}
