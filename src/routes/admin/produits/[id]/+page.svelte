<script lang="ts">
	import CustomizationsEditor from '#lib/client/ui/admin/CustomizationsEditor.svelte';
	import ProductGeneralForm from '#lib/client/ui/admin/ProductGeneralForm.svelte';
	import ProductImages from '#lib/client/ui/admin/ProductImages.svelte';
	import VariantsEditor from '#lib/client/ui/admin/VariantsEditor.svelte';
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '#lib/client/ui/shadcn/tabs';
	import { getAdminProduct, getCatalogueMeta } from '#lib/remote/admin.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const productId = $derived(page.params.id ?? 'nouveau');
	const isNew = $derived(productId === 'nouveau');

	const loaded = $derived(
		await Promise.all([getCatalogueMeta(), isNew ? null : getAdminProduct(productId)])
	);
	const meta = $derived(loaded[0]);
	const product = $derived(loaded[1]);
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">
				{product ? product.name : 'Nouveau produit'}
			</h1>
			{#if product}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Badge variant={product.status === 'PUBLISHED' ? 'default' : 'secondary'}>
						{product.status}
					</Badge>
					<span>/{product.slug}</span>
				</div>
			{/if}
		</div>
		<div class="flex gap-2">
			{#if product && product.status === 'PUBLISHED'}
				<Button variant="outline" href={resolve('/[slug]', { slug: product.slug })}>
					Voir la fiche
				</Button>
			{/if}
			<Button variant="ghost" href={resolve('/admin/produits')}>Retour</Button>
		</div>
	</div>

	{#key productId}
		{#if product}
			<Tabs value="general">
				<TabsList>
					<TabsTrigger value="general">Général</TabsTrigger>
					<TabsTrigger value="variantes">Variantes</TabsTrigger>
					<TabsTrigger value="perso">Personnalisation</TabsTrigger>
					<TabsTrigger value="images">Images</TabsTrigger>
				</TabsList>

				<TabsContent value="general" class="pt-4">
					<ProductGeneralForm {product} {meta} />
				</TabsContent>
				<TabsContent value="variantes" class="pt-4">
					<VariantsEditor {product} {meta} />
				</TabsContent>
				<TabsContent value="perso" class="pt-4">
					<CustomizationsEditor {product} />
				</TabsContent>
				<TabsContent value="images" class="pt-4">
					<ProductImages {product} />
				</TabsContent>
			</Tabs>
		{:else}
			<ProductGeneralForm {meta} />
		{/if}
	{/key}
</div>
