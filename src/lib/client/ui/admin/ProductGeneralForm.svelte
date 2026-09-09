<script lang="ts">
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Checkbox } from '#lib/client/ui/shadcn/checkbox';
	import { Input } from '#lib/client/ui/shadcn/input';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { Textarea } from '#lib/client/ui/shadcn/textarea';
	import { toMessage } from '#lib/client/utils/errors';
	import { toCents } from '#lib/client/utils/money';
	import {
		createProduct,
		updateProduct,
		type getAdminProduct,
		type getCatalogueMeta
	} from '#lib/remote/admin.remote';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type Product = Awaited<ReturnType<typeof getAdminProduct>>;
	type Meta = Awaited<ReturnType<typeof getCatalogueMeta>>;

	let { product = null, meta }: { product?: Product | null; meta: Meta } = $props();

	/**
	 * Le formulaire est une copie de travail : la page le remonte via `{#key}`
	 * quand on change de produit, d'ou la lecture unique de la valeur initiale.
	 */
	const initial = untrack(() => product);

	let name = $state(initial?.name ?? '');
	let slug = $state(initial?.slug ?? '');
	let summary = $state(initial?.summary ?? '');
	let description = $state(initial?.description ?? '');
	let story = $state(initial?.story ?? '');
	let badge = $state(initial?.badge ?? '');
	let basePrice = $state<string | number>((initial?.basePriceCents ?? 0) / 100);
	let handmade = $state(initial?.handmade ?? true);
	let featured = $state(initial?.featured ?? false);
	let status = $state<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(initial?.status ?? 'DRAFT');

	let categorySlugs = $state<string[]>(initial?.categories.map((entry) => entry.slug) ?? []);
	let attributes = $state<string[]>(
		initial?.attributeValues.map(
			(entry) => `${entry.attributeValue.attribute.key}:${entry.attributeValue.value}`
		) ?? []
	);

	let pending = $state(false);
	let feedback = $state('');

	function toggle(list: string[], value: string) {
		return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
	}

	function buildPayload() {
		return {
			slug: slug.trim() === '' ? null : slug.trim(),
			name: name.trim(),
			summary: summary.trim() === '' ? null : summary.trim(),
			description: description.trim(),
			story: story.trim() === '' ? null : story.trim(),
			badge: badge.trim() === '' ? null : badge.trim(),
			basePriceCents: toCents(basePrice),
			handmade,
			featured,
			status,
			categorySlugs,
			attributes: attributes.map((token) => {
				const separator = token.indexOf(':');
				return { attributeKey: token.slice(0, separator), value: token.slice(separator + 1) };
			}),
			images: [],
			variants: []
		};
	}

	async function save() {
		pending = true;
		feedback = '';

		try {
			if (product) {
				await updateProduct({ productId: product.id, product: buildPayload() });
				feedback = 'Produit enregistré.';
			} else {
				const created = await createProduct(buildPayload());
				await goto(resolve('/admin/produits/[id]', { id: created.id }));
			}
		} catch (error) {
			feedback = toMessage(error, "L'enregistrement a échoué.");
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex max-w-3xl flex-col gap-5">
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="flex flex-col gap-2">
			<Label for="product-name">Nom</Label>
			<Input id="product-name" bind:value={name} placeholder="Collier Étoile Filante" />
		</div>
		<div class="flex flex-col gap-2">
			<Label for="product-slug">Slug (vide = généré depuis le nom)</Label>
			<Input id="product-slug" bind:value={slug} placeholder="collier-etoile-filante" />
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<Label for="product-summary">Résumé</Label>
		<Input id="product-summary" bind:value={summary} placeholder="perles de verre chinées" />
	</div>

	<div class="flex flex-col gap-2">
		<Label for="product-description">Description</Label>
		<Textarea id="product-description" rows={4} bind:value={description} />
	</div>

	<div class="flex flex-col gap-2">
		<Label for="product-story">Histoire de la pièce (facultatif)</Label>
		<Textarea id="product-story" rows={3} bind:value={story} />
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<div class="flex flex-col gap-2">
			<Label for="product-price">Prix de référence (€)</Label>
			<Input id="product-price" type="number" step="0.01" min="0" bind:value={basePrice} />
		</div>
		<div class="flex flex-col gap-2">
			<Label for="product-badge">Pastille</Label>
			<Input id="product-badge" bind:value={badge} placeholder="Nouveau" />
		</div>
		<div class="flex flex-col gap-2">
			<Label for="product-status">État</Label>
			<select
				id="product-status"
				bind:value={status}
				class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
			>
				<option value="DRAFT">Brouillon</option>
				<option value="PUBLISHED">En ligne</option>
				<option value="ARCHIVED">Archivé</option>
			</select>
		</div>
	</div>

	<div class="flex flex-wrap gap-6">
		<Label class="cursor-pointer">
			<Checkbox bind:checked={handmade} />
			Fait main
		</Label>
		<Label class="cursor-pointer">
			<Checkbox bind:checked={featured} />
			Mis en avant sur l’accueil
		</Label>
	</div>

	<div class="flex flex-col gap-2">
		<Label>Univers</Label>
		<div class="flex flex-wrap gap-2">
			{#each meta.categories as category (category.slug)}
				<Button
					variant={categorySlugs.includes(category.slug) ? 'default' : 'outline'}
					size="sm"
					onclick={() => (categorySlugs = toggle(categorySlugs, category.slug))}
				>
					{category.name}
				</Button>
			{/each}
			{#if meta.categories.length === 0}
				<p class="text-sm text-muted-foreground">
					Aucun univers : crée-les dans l’onglet Catalogue.
				</p>
			{/if}
		</div>
	</div>

	{#each meta.attributes as attribute (attribute.key)}
		<div class="flex flex-col gap-2">
			<Label>{attribute.label}</Label>
			<div class="flex flex-wrap gap-2">
				{#each attribute.values as value (value.id)}
					{@const token = `${attribute.key}:${value.value}`}
					<Button
						variant={attributes.includes(token) ? 'default' : 'outline'}
						size="sm"
						onclick={() => (attributes = toggle(attributes, token))}
					>
						{value.label}
					</Button>
				{/each}
			</div>
		</div>
	{/each}

	<div class="flex items-center gap-3">
		<Button onclick={save} disabled={pending}>
			{pending ? 'Enregistrement…' : product ? 'Enregistrer' : 'Créer le produit'}
		</Button>
		{#if feedback}
			<span class="text-sm text-muted-foreground">{feedback}</span>
		{/if}
	</div>

	{#if !product}
		<p class="text-sm text-muted-foreground">
			Variantes, personnalisation et images se règlent une fois le produit créé.
		</p>
	{/if}
</div>
