<script lang="ts">
	import { formatPrice } from '#lib/client/utils/money';
	import type { getMyLoyalty } from '#lib/remote/loyalty.remote';

	type Props = { loyalty: Awaited<ReturnType<typeof getMyLoyalty>> };

	let { loyalty }: Props = $props();

	const progress = $derived(
		loyalty.next === null
			? 100
			: Math.min(
					100,
					Math.round(
						((loyalty.spentCents - (loyalty.current?.thresholdCents ?? 0)) /
							Math.max(
								1,
								loyalty.next.tier.thresholdCents - (loyalty.current?.thresholdCents ?? 0)
							)) *
							100
					)
				)
	);
</script>

<section class="flex flex-col gap-3 rounded-[22px] border-2 border-ink bg-paper px-6 py-5">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<span class="text-[12px] font-semibold tracking-[0.16em] text-pink-deep uppercase">
			Fidélité
		</span>
		<span class="text-[13px] text-ink/60">
			{formatPrice(loyalty.spentCents)} d'achats
		</span>
	</div>

	<div class="flex flex-wrap items-center gap-3">
		{#if loyalty.current}
			<span
				class="rounded-[40px] border-2 border-ink px-4 py-1.5 text-[15px] font-semibold"
				style="background:{loyalty.current.color}"
			>
				{loyalty.current.name}
			</span>
			<span class="text-[14px] text-ink/75">
				{#if loyalty.current.discountPercent > 0}
					−{loyalty.current.discountPercent} % sur chaque commande
				{/if}
				{#if loyalty.current.discountPercent > 0 && loyalty.current.freeShipping}
					·
				{/if}
				{#if loyalty.current.freeShipping}
					livraison offerte
				{/if}
			</span>
		{:else}
			<span class="text-[14.5px] text-ink/75">
				Tes achats te rapprochent d'avantages fidélité.
			</span>
		{/if}
	</div>

	{#if loyalty.next}
		<div class="flex flex-col gap-1.5">
			<div
				class="h-2.5 overflow-hidden rounded-full bg-ink/10"
				role="progressbar"
				aria-valuenow={progress}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label="Progression vers le palier {loyalty.next.tier.name}"
			>
				<span class="block h-full rounded-full bg-pink" style="width:{progress}%"></span>
			</div>
			<span class="text-[13.5px] text-ink/70">
				Encore {formatPrice(loyalty.next.remainingCents)} pour atteindre
				<strong>{loyalty.next.tier.name}</strong>.
			</span>
		</div>
	{:else if loyalty.current}
		<span class="text-[13.5px] text-ink/70">Tu es au palier le plus élevé. Merci ♡</span>
	{/if}
</section>
