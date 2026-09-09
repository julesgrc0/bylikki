<script lang="ts">
	import { constrainsOf } from '#lib/client/validation/constrains';
	import { imageAccept, MAX_REVIEW_PHOTOS } from '#lib/client/validation/media';
	import { reviewSchema } from '#lib/client/validation/review';
	import { submitReview } from '#lib/remote/review.remote';
	import ChunkyButton from './ChunkyButton.svelte';

	let { productSlug, defaultAuthorName = '' }: { productSlug: string; defaultAuthorName?: string } =
		$props();

	/** Une instance de formulaire par produit : deux fiches ouvertes ne se marchent pas dessus. */
	const instance = $derived(submitReview.for(productSlug));

	let rating = $state(5);
	/** Zero = non renseigne : ces deux notes restent facultatives. */
	let qualityRating = $state(0);
	let accuracyRating = $state(0);

	const criteria = $derived([
		{
			label: 'Qualité de la finition',
			value: qualityRating,
			set: (value: number) => (qualityRating = qualityRating === value ? 0 : value)
		},
		{
			label: 'Conforme à la photo',
			value: accuracyRating,
			set: (value: number) => (accuracyRating = accuracyRating === value ? 0 : value)
		}
	]);
</script>

<form
	{...instance}
	enctype="multipart/form-data"
	class="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px]"
>
	<h3 class="m-0 text-[20px] font-semibold lg:text-[22px]">Laisser un avis</h3>

	<input {...instance.fields.productSlug.as('hidden', productSlug)} />
	<input {...instance.fields.rating.as('hidden', rating)} />

	<div class="flex flex-col gap-2">
		<span class="text-[13px] font-semibold">Ta note</span>
		<div class="flex gap-1.5">
			{#each [1, 2, 3, 4, 5] as value (value)}
				<button
					type="button"
					onclick={() => (rating = value)}
					aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
					aria-pressed={rating === value}
					class="cursor-pointer text-[26px] leading-none {rating >= value
						? 'text-pink'
						: 'text-ink/25'}"
				>
					★
				</button>
			{/each}
		</div>
		{#each instance.fields.rating.issues() ?? [] as issue (issue.message)}
			<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
		{/each}
	</div>

	<input {...instance.fields.qualityRating.as('hidden', qualityRating)} />
	<input {...instance.fields.accuracyRating.as('hidden', accuracyRating)} />

	<div class="flex flex-col gap-2.5">
		<span class="text-[13px] font-semibold">Dans le détail (facultatif)</span>
		{#each criteria as criterion (criterion.label)}
			<div class="flex flex-wrap items-center justify-between gap-2">
				<span class="text-[13.5px] text-ink/75">{criterion.label}</span>
				<div class="flex gap-1">
					{#each [1, 2, 3, 4, 5] as value (value)}
						<button
							type="button"
							onclick={() => criterion.set(value)}
							aria-label={`${criterion.label} : ${value} étoile${value > 1 ? 's' : ''}`}
							aria-pressed={criterion.value === value}
							class="cursor-pointer text-[19px] leading-none {criterion.value >= value
								? 'text-pink'
								: 'text-ink/25'}"
						>
							★
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="flex flex-col gap-2">
		<label for="review-author" class="text-[13px] font-semibold">Prénom affiché</label>
		<input
			id="review-author"
			{...instance.fields.authorName.as('text')}
			{...constrainsOf(reviewSchema, 'authorName')}
			value={instance.fields.authorName.value() || defaultAuthorName}
			placeholder="Emma"
			class="rounded-[16px] border-[1.5px] border-ink/25 bg-cream px-4 py-3 text-[15px] outline-none focus:border-pink"
		/>
		{#each instance.fields.authorName.issues() ?? [] as issue (issue.message)}
			<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
		{/each}
	</div>

	<div class="flex flex-col gap-2">
		<label for="review-title" class="text-[13px] font-semibold">Titre (facultatif)</label>
		<input
			id="review-title"
			{...instance.fields.title.as('text')}
			{...constrainsOf(reviewSchema, 'title')}
			placeholder="Encore plus beau en vrai"
			class="rounded-[16px] border-[1.5px] border-ink/25 bg-cream px-4 py-3 text-[15px] outline-none focus:border-pink"
		/>
	</div>

	<div class="flex flex-col gap-2">
		<label for="review-body" class="text-[13px] font-semibold">Ton avis</label>
		<textarea
			id="review-body"
			name={instance.fields.body.as('text').name}
			{...constrainsOf(reviewSchema, 'body')}
			rows="4"
			placeholder="Ce que tu as aimé, ce que tu portes avec…"
			class="rounded-[16px] border-[1.5px] border-ink/25 bg-cream px-4 py-3 text-[15px] outline-none focus:border-pink"
		></textarea>
		{#each instance.fields.body.issues() ?? [] as issue (issue.message)}
			<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
		{/each}
	</div>

	<div class="flex flex-col gap-2">
		<label for="review-photos" class="text-[13px] font-semibold">
			Photos (facultatif, {MAX_REVIEW_PHOTOS} maximum)
		</label>
		<input
			id="review-photos"
			{...instance.fields.photos.as('file multiple')}
			accept={imageAccept}
			class="text-[14px] file:mr-3 file:cursor-pointer file:rounded-[40px] file:border-[1.5px] file:border-ink file:bg-yellow-soft file:px-4 file:py-2 file:text-[13px] file:font-semibold"
		/>
		<span class="text-[12.5px] text-ink/55">
			Les images sont converties en WebP et allégées ; les données EXIF, dont la localisation, sont
			supprimées.
		</span>
		{#each instance.fields.photos.issues() ?? [] as issue (issue.message)}
			<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
		{/each}
	</div>

	<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
		<ChunkyButton type="submit" disabled={instance.pending > 0}>
			{instance.pending > 0 ? 'Envoi…' : 'Publier mon avis'}
		</ChunkyButton>
		{#if instance.result?.submitted}
			<span class="text-[13.5px] text-ink/70"> Merci ! Ton avis apparaîtra après relecture. </span>
		{/if}
	</div>

	<p class="m-0 text-[12.5px] leading-[1.5] text-ink/55">
		Seuls le prénom que tu choisis et ton avis sont publiés. Ton adresse e-mail reste privée.
	</p>
</form>
