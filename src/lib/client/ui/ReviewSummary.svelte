<script lang="ts">
	import { buildQueryString } from '#lib/client/utils/search-params';
	import { reviewSortLabels, reviewSorts, type ReviewSort } from '#lib/client/validation/review';
	import type { getProductReviews } from '#lib/remote/review.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import RatingStars from './RatingStars.svelte';

	type Breakdown = Awaited<ReturnType<typeof getProductReviews>>['breakdown'];

	type Props = { slug: string; breakdown: Breakdown };

	let { slug, breakdown }: Props = $props();

	const activeSort = $derived((page.url.searchParams.get('avis') ?? 'utiles') as ReviewSort);
	const activeRating = $derived(Number(page.url.searchParams.get('note')) || null);
	const withPhotos = $derived(page.url.searchParams.get('photos') === '1');
	const verifiedOnly = $derived(page.url.searchParams.get('verifies') === '1');

	/**
	 * Les filtres passent par l'URL, comme la recherche : un avis filtre reste
	 * partageable, et le retour arriere du navigateur fonctionne.
	 */
	async function apply(patch: Record<string, string | null>) {
		const current: Record<string, string> = {
			avis: activeSort,
			note: activeRating === null ? '' : String(activeRating),
			photos: withPhotos ? '1' : '',
			verifies: verifiedOnly ? '1' : '',
			...Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, value ?? '']))
		};

		const queryString = buildQueryString(Object.entries(current));

		await goto(resolve(queryString ? `/${slug}?${queryString}` : `/${slug}`), {
			keepFocus: true,
			noScroll: true
		});
	}

	const criteria = $derived(
		[
			{ label: 'Qualité', value: breakdown.quality },
			{ label: 'Conforme à la photo', value: breakdown.accuracy }
		].filter((criterion): criterion is { label: string; value: number } => criterion.value !== null)
	);
</script>

{#if breakdown.total > 0}
	<div class="flex flex-col gap-5 rounded-[22px] border-2 border-ink bg-paper px-5 py-5 lg:px-7">
		<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-10">
			<div class="flex shrink-0 flex-col gap-1.5">
				<span class="text-[40px] leading-none font-semibold">
					{breakdown.average.toFixed(1).replace('.', ',')}
				</span>
				<RatingStars rating={Math.round(breakdown.average)} />
				<span class="text-[13px] text-ink/60">
					{breakdown.total} avis
				</span>
			</div>

			<!-- répartition des notes, cliquable pour filtrer -->
			<ul class="m-0 flex min-w-0 flex-1 list-none flex-col gap-1.5 p-0">
				{#each breakdown.distribution as line (line.rating)}
					<li>
						<button
							onclick={() =>
								apply({ note: activeRating === line.rating ? null : String(line.rating) })}
							disabled={line.count === 0}
							aria-pressed={activeRating === line.rating}
							class="flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-1.5 py-0.5 text-left text-[13px] disabled:cursor-default disabled:opacity-45 {activeRating ===
							line.rating
								? 'bg-pink-pale'
								: 'hover:bg-cream'}"
						>
							<span class="w-9 shrink-0 tabular-nums">{line.rating} ★</span>
							<span class="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10">
								<span class="block h-full rounded-full bg-pink" style="width:{line.share}%"></span>
							</span>
							<span class="w-10 shrink-0 text-right text-ink/60 tabular-nums">{line.count}</span>
						</button>
					</li>
				{/each}
			</ul>

			{#if criteria.length > 0}
				<dl class="m-0 flex shrink-0 flex-col gap-2 text-[13.5px]">
					{#each criteria as criterion (criterion.label)}
						<div class="flex items-center gap-2.5">
							<dt class="m-0 text-ink/70">{criterion.label}</dt>
							<dd class="m-0 font-semibold">
								{criterion.value.toFixed(1).replace('.', ',')}
							</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-2 border-t-[1.5px] border-ink/12 pt-4">
			<label class="text-[13px] text-ink/70" for="review-sort">Trier</label>
			<select
				id="review-sort"
				value={activeSort}
				onchange={(event) => apply({ avis: event.currentTarget.value })}
				class="rounded-[40px] border-[1.5px] border-ink/30 bg-paper px-3.5 py-1.5 text-[13px]"
			>
				{#each reviewSorts as sort (sort)}
					<option value={sort}>{reviewSortLabels[sort]}</option>
				{/each}
			</select>

			<button
				onclick={() => apply({ photos: withPhotos ? null : '1' })}
				aria-pressed={withPhotos}
				class="cursor-pointer rounded-[40px] border-[1.5px] px-3.5 py-1.5 text-[13px] {withPhotos
					? 'border-ink bg-pink-soft font-semibold'
					: 'border-ink/30 hover:border-ink'}"
			>
				Avec photo
			</button>

			<button
				onclick={() => apply({ verifies: verifiedOnly ? null : '1' })}
				aria-pressed={verifiedOnly}
				class="cursor-pointer rounded-[40px] border-[1.5px] px-3.5 py-1.5 text-[13px] {verifiedOnly
					? 'border-ink bg-green-soft font-semibold'
					: 'border-ink/30 hover:border-ink'}"
			>
				Achat vérifié
			</button>

			{#if activeRating || withPhotos || verifiedOnly}
				<button
					onclick={() => apply({ note: null, photos: null, verifies: null })}
					class="cursor-pointer border-b-[1.5px] border-ink/40 pb-px text-[13px] text-ink/70"
				>
					Tout afficher
				</button>
			{/if}
		</div>
	</div>
{/if}
