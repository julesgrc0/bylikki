<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';
	import type { ReviewFiltersInput } from '#lib/client/validation/review';
	import { getProductReviews, voteReviewHelpful } from '#lib/remote/review.remote';
	import { page } from '$app/state';
	import RatingStars from './RatingStars.svelte';

	type Review = Awaited<ReturnType<typeof getProductReviews>>['reviews'][number];

	type Props = {
		reviews: Review[];
		votedReviewIds: string[];
		filters: ReviewFiltersInput;
	};

	let { reviews, votedReviewIds, filters }: Props = $props();

	const signedIn = $derived(page.data.signedIn === true);
	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

	let voting = $state('');
	let voteError = $state('');

	async function vote(reviewId: string) {
		voting = reviewId;
		voteError = '';

		try {
			await voteReviewHelpful({ reviewId, filters });
		} catch (error) {
			voteError = toMessage(error, "Ton vote n'a pas pu être enregistré.");
		} finally {
			voting = '';
		}
	}

	const criteria = [
		{ key: 'qualityRating' as const, label: 'Qualité' },
		{ key: 'accuracyRating' as const, label: 'Conforme à la photo' }
	];
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

				{#if review.qualityRating || review.accuracyRating}
					<ul
						class="m-0 mt-2.5 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-[13px] text-ink/70"
					>
						{#each criteria as criterion (criterion.key)}
							{#if review[criterion.key]}
								<li class="flex items-center gap-1.5">
									{criterion.label}
									<RatingStars rating={review[criterion.key] ?? 0} />
								</li>
							{/if}
						{/each}
					</ul>
				{/if}

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

				{#if review.replyBody}
					<div class="mt-3 rounded-[16px] border-[1.5px] border-ink/15 bg-pink-pale px-4 py-3">
						<span class="text-[12px] font-semibold tracking-[0.14em] text-pink-deep uppercase">
							Réponse de l'atelier
						</span>
						<p class="mt-1 mb-0 text-[14px] leading-[1.6] text-ink/80">{review.replyBody}</p>
					</div>
				{/if}

				<div class="mt-3 flex flex-wrap items-center gap-3">
					{#if signedIn}
						{@const voted = votedReviewIds.includes(review.id)}
						<button
							onclick={() => vote(review.id)}
							disabled={voting === review.id}
							aria-pressed={voted}
							class="cursor-pointer rounded-[40px] border-[1.5px] px-3.5 py-1.5 text-[13px] font-semibold disabled:opacity-50 {voted
								? 'border-ink bg-pink-soft'
								: 'border-ink/30 hover:border-ink'}"
						>
							{voted ? '♥ Utile' : '♡ Utile'}
							{#if review.helpfulCount > 0}
								· {review.helpfulCount}
							{/if}
						</button>
					{:else if review.helpfulCount > 0}
						<span class="text-[13px] text-ink/60">
							{review.helpfulCount} personne(s) ont trouvé cet avis utile
						</span>
					{/if}
				</div>
			</li>
		{/each}
	</ul>

	{#if voteError}
		<span class="mt-2 block text-[13px] font-semibold text-pink-deep">{voteError}</span>
	{/if}
{/if}
