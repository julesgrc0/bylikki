<script lang="ts">
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { imageAccept } from '#lib/client/validation/media';
	import { addImage, removeImage, type getAdminProduct } from '#lib/remote/admin.remote';

	type Product = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

	let { product }: { product: Product } = $props();

	const form = $derived(addImage.for(product.id));
</script>

<div class="flex flex-col gap-6">
	{#if product.images.length > 0}
		<div class="flex flex-wrap gap-4">
			{#each product.images as image (image.id)}
				<figure class="m-0 flex w-40 flex-col gap-2">
					<img
						src={image.url}
						alt={image.alt || product.name}
						class="h-40 w-40 rounded-md border object-cover"
					/>
					<Button
						size="sm"
						variant="outline"
						onclick={() => removeImage({ productId: product.id, imageId: image.id })}
					>
						Retirer
					</Button>
				</figure>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">
			Aucune photo : la fiche produit affiche un aplat hachuré à la place.
		</p>
	{/if}

	<form
		{...form}
		enctype="multipart/form-data"
		class="flex max-w-xl flex-col gap-4 rounded-lg border p-4"
	>
		<input {...form.fields.productId.as('hidden', product.id)} />

		<div class="flex flex-col gap-2">
			<Label for="image-file">Ajouter une photo</Label>
			<input
				id="image-file"
				{...form.fields.photo.as('file')}
				accept={imageAccept}
				class="text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
			/>
			<span class="text-xs text-muted-foreground">
				Convertie en WebP, réduite à 1600 px, métadonnées EXIF supprimées.
			</span>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="image-alt">Texte alternatif</Label>
			<input
				id="image-alt"
				{...form.fields.alt.as('text')}
				placeholder="Collier posé sur un tissu clair"
				class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
			/>
		</div>

		{#each form.fields.allIssues() ?? [] as issue (issue.message)}
			<span class="text-sm font-medium text-destructive">{issue.message}</span>
		{/each}

		<Button type="submit" disabled={form.pending > 0}>
			{form.pending > 0 ? 'Envoi…' : 'Envoyer la photo'}
		</Button>
	</form>
</div>
