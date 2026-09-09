<script lang="ts">
	import { reviewCardBg, reviewCardRadius } from '#lib/client/data/content';
	import { getLatestReviews } from '#lib/remote/review.remote';
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';

	type Review = Awaited<ReturnType<typeof getLatestReviews>>[number];

	let { reviews = [] }: { reviews?: Review[] } = $props();

	let index = $state(0);
	/** en dessous de 1024px le rail défile au doigt, pas au transform */
	let wide = $state(false);
	const step = 430;

	onMount(() => {
		const query = window.matchMedia('(min-width: 1024px)');
		const sync = () => (wide = query.matches);
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	const maxIndex = $derived(Math.max(reviews.length - 3, 0));
	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

	const prev = () => (index = Math.max(index - 1, 0));
	const next = () => (index = Math.min(index + 1, maxIndex));
	const rotation = (position: number) =>
		position % 3 === 0 ? -1.2 : position % 3 === 1 ? 1.4 : -0.5;
</script>

{#if reviews.length > 0}
	<section
		id="avis"
		class="overflow-hidden bg-cream px-5 py-12 lg:px-[70px] lg:pt-[74px] lg:pb-[84px]"
	>
		<div class="mb-6 flex items-end justify-between lg:mb-[34px]">
			<h2 class="m-0 text-[28px] font-semibold lg:text-[46px]">Vos avis</h2>
			<div class="flex gap-2.5">
				<button
					onclick={prev}
					aria-label="Avis précédents"
					class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink text-[18px] disabled:opacity-40"
					disabled={!wide || index === 0}
				>
					←
				</button>
				<button
					onclick={next}
					aria-label="Avis suivants"
					class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-pink text-[18px] text-white disabled:opacity-40"
					disabled={!wide || index === maxIndex}
				>
					→
				</button>
			</div>
		</div>

		<div class="-mx-5 overflow-x-auto px-5 lg:mx-0 lg:overflow-hidden lg:px-0">
			<div
				class="flex snap-x gap-4 transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] lg:gap-[26px]"
				style={wide ? `transform:translateX(-${index * step}px)` : undefined}
			>
				{#each reviews as review, position (review.id)}
					<figure
						class="m-0 w-[280px] flex-none snap-start border-2 border-ink p-5 sm:w-[404px] lg:px-[26px] lg:py-6"
						style="background:{reviewCardBg[
							position % reviewCardBg.length
						]};border-radius:{reviewCardRadius[
							position % reviewCardRadius.length
						]};transform:rotate({rotation(position)}deg)"
					>
						<div class="text-[15px] tracking-[0.14em] text-pink">
							{'★'.repeat(review.rating)}<span class="text-ink/25"
								>{'★'.repeat(5 - review.rating)}</span
							>
						</div>
						<blockquote
							class="my-3 mb-[18px] ml-0 font-hand text-[23px] leading-[1.28] lg:text-[25px]"
						>
							“{review.body}”
						</blockquote>
						<figcaption class="flex items-center gap-3">
							<div
								class="h-11 w-11 rounded-[12px] border-[1.5px] border-ink/30"
								style="background:repeating-linear-gradient(135deg,rgba(46,27,51,.14) 0 5px,rgba(255,255,255,0) 5px 10px),#FFFCF7"
							></div>
							<div>
								<div class="text-[17px]">{review.authorName}</div>
								<div class="text-[12px] text-ink/55">
									{dateFormatter.format(review.createdAt)} ·
									<a href={resolve('/[slug]', { slug: review.product.slug })} class="text-ink/55">
										{review.product.name}
									</a>
								</div>
							</div>
						</figcaption>
					</figure>
				{/each}
			</div>
		</div>
	</section>
{/if}
