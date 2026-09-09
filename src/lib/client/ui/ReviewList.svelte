<script lang="ts">
	import type { getProductReviews } from '#lib/remote/review.remote';
	import RatingStars from './RatingStars.svelte';

	type Review = Awaited<ReturnType<typeof getProductReviews>>['reviews'][number];

	let { reviews }: { reviews: Review[] } = $props();

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
</script>

{#if reviews.length === 0}
	<p class="m-0 text-[15px] text-ink/65">
		Pas encore d’avis sur cette pièce — tu peux être la première.
	</p>
{:else}
	<ul class="m-0 flex list-none flex-col gap-4 p-0">
		{#each reviews as review (review.id)}
			<li class="rounded-[20px] border-[1.5px] border-ink/15 bg-paper px-5 py-4">
				<div class="flex flex-wrap items-center gap-3">
					{#if review.user?.avatarUrl}
						<img
							src={review.user.avatarUrl}
							alt=""
							loading="lazy"
							class="h-9 w-9 rounded-full border-[1.5px] border-ink/25 object-cover"
						/>
					{/if}
					<RatingStars rating={review.rating} />
					<span class="text-[15px] font-semibold">{review.authorName}</span>
					{#if review.verifiedPurchase}
						<span
							class="rounded-[20px] border-[1.5px] border-ink bg-green-soft px-2.5 py-[3px] text-[11.5px] font-semibold"
						>
							Achat vérifié
						</span>
					{/if}
					<span class="text-[12.5px] text-ink/55">{dateFormatter.format(review.createdAt)}</span>
				</div>
				{#if review.title}
					<div class="mt-2 text-[16px] font-semibold">{review.title}</div>
				{/if}
				<p class="mt-1.5 mb-0 text-[14.5px] leading-[1.6] text-ink/80">{review.body}</p>

				{#if review.photos.length > 0}
					<div class="mt-3 flex flex-wrap gap-2.5">
						{#each review.photos as photo (photo.id)}
							<img
								src={photo.url}
								alt="La pièce reçue par la cliente"
								width={photo.width}
								height={photo.height}
								loading="lazy"
								class="h-[110px] w-[110px] rounded-[14px] border-[1.5px] border-ink/20 object-cover"
							/>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
