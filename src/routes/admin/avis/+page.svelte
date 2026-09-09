<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { getAdminReviews, setReviewStatus } from '#lib/remote/admin.remote';
	import { resolve } from '$app/paths';

	const statuses = ['PENDING', 'PUBLISHED', 'REJECTED'] as const;
	const statusLabels: Record<(typeof statuses)[number], string> = {
		PENDING: 'À modérer',
		PUBLISHED: 'Publiés',
		REJECTED: 'Rejetés'
	};

	let status = $state<(typeof statuses)[number]>('PENDING');
	const reviews = $derived(await getAdminReviews(status));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

	let pending = $state('');

	async function moderate(reviewId: string, next: 'PUBLISHED' | 'REJECTED') {
		pending = reviewId;

		try {
			await setReviewStatus({ reviewId, status: next });
			await getAdminReviews(status).refresh();
		} finally {
			pending = '';
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Avis</h1>
		<p class="text-sm text-muted-foreground">
			Un avis n’apparaît sur la fiche produit qu’une fois publié ici.
		</p>
	</div>

	<div class="flex gap-2">
		{#each statuses as entry (entry)}
			<Button
				size="sm"
				variant={status === entry ? 'default' : 'outline'}
				onclick={() => (status = entry)}
			>
				{statusLabels[entry]}
			</Button>
		{/each}
	</div>

	{#if reviews.length === 0}
		<p class="text-sm text-muted-foreground">Rien dans cette file.</p>
	{:else}
		<ul class="m-0 flex list-none flex-col gap-4 p-0">
			{#each reviews as review (review.id)}
				<li class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="flex flex-wrap items-center gap-2">
						<span class="text-sm font-medium">{review.authorName}</span>
						<span class="text-sm text-muted-foreground">{'★'.repeat(review.rating)}</span>
						{#if review.verifiedPurchase}
							<Badge variant="secondary">Achat vérifié</Badge>
						{/if}
						<span class="text-xs text-muted-foreground">
							{dateFormatter.format(review.createdAt)} ·
							<a href={resolve('/[slug]', { slug: review.product.slug })} class="underline">
								{review.product.name}
							</a>
						</span>
					</div>

					{#if review.title}
						<div class="font-medium">{review.title}</div>
					{/if}
					<p class="m-0 text-sm">{review.body}</p>

					{#if review.photos.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each review.photos as photo (photo.id)}
								<img
									src={photo.url}
									alt="Pièce reçue par la cliente"
									class="h-24 w-24 rounded-md border object-cover"
								/>
							{/each}
						</div>
					{/if}

					<div class="flex gap-2">
						{#if review.status !== 'PUBLISHED'}
							<Button
								size="sm"
								disabled={pending === review.id}
								onclick={() => moderate(review.id, 'PUBLISHED')}
							>
								Publier
							</Button>
						{/if}
						{#if review.status !== 'REJECTED'}
							<Button
								size="sm"
								variant="destructive"
								disabled={pending === review.id}
								onclick={() => moderate(review.id, 'REJECTED')}
							>
								Rejeter
							</Button>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>
