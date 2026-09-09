<script lang="ts">
	import type { LegalDoc } from '#lib/client/data/legal';

	let { doc }: { doc: LegalDoc } = $props();
</script>

<article
	class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.1)] lg:rounded-[28px] lg:px-12 lg:pt-11 lg:pb-12 lg:shadow-[12px_14px_0_rgba(46,27,51,.1)]"
>
	<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">{doc.tag}</span>
	<h2 class="mt-2.5 mb-1.5 text-[28px] leading-[1.06] font-semibold lg:text-[40px]">{doc.title}</h2>
	<span class="text-[13px] text-ink/55">Dernière mise à jour — {doc.updated}</span>

	<div class="mt-[26px] mb-1 h-[1.5px] bg-ink/15"></div>

	<div class="mt-[22px] flex flex-col gap-6 lg:gap-[26px]">
		{#each doc.blocks as block (block.h)}
			<section class="flex flex-col gap-2">
				<h3 class="m-0 text-[18px] font-semibold lg:text-[19px]">{block.h}</h3>
				<p
					class="m-0 max-w-[74ch] text-[15px] leading-[1.62] text-pretty text-ink/80 lg:text-[15.5px]"
				>
					{block.p}
				</p>
			</section>
		{/each}
	</div>

	<div
		class="mt-9 flex flex-col items-start gap-3.5 rounded-[22px] bg-yellow-soft px-6 py-5 lg:flex-row lg:items-center lg:gap-[18px]"
	>
		<span class="font-hand text-[22px] lg:text-[24px]">version PDF si tu préfères →</span>
		<button
			class="cursor-pointer rounded-[40px] bg-ink px-[22px] py-3 text-[14px] font-semibold text-cream"
		>
			Télécharger ({doc.tag})
		</button>
	</div>
</article>
