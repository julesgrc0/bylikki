<script lang="ts">
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Checkbox } from '#lib/client/ui/shadcn/checkbox';
	import { Input } from '#lib/client/ui/shadcn/input';
	import { Label } from '#lib/client/ui/shadcn/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/client/ui/shadcn/table';
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice, toCents, toInteger } from '#lib/client/utils/money';
	import {
		deleteVariant,
		upsertVariant,
		type getAdminProduct,
		type getCatalogueMeta
	} from '#lib/remote/admin.remote';

	type Product = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;
	type Meta = Awaited<ReturnType<typeof getCatalogueMeta>>;

	let { product, meta }: { product: Product; meta: Meta } = $props();

	/** Seuls les criteres declares comme axes de variante composent une declinaison. */
	const axes = $derived(meta.attributes.filter((attribute) => attribute.variantAxis));

	let sku = $state('');
	let label = $state('');
	let price = $state<string | number>('');
	let compareAt = $state<string | number>('');
	let stock = $state<string | number>(0);
	let available = $state(true);
	let selected = $state<string[]>([]);
	let pending = $state(false);
	let feedback = $state('');

	function reset() {
		sku = '';
		label = '';
		price = '';
		compareAt = '';
		stock = 0;
		available = true;
		selected = [];
	}

	function edit(variant: Product['variants'][number]) {
		sku = variant.sku;
		label = variant.label;
		price = variant.priceCents / 100;
		compareAt = variant.compareAtPriceCents ? variant.compareAtPriceCents / 100 : '';
		stock = variant.stock;
		available = variant.available;
		selected = variant.attributeValues.map(
			(entry) => `${entry.attributeValue.attribute.key}:${entry.attributeValue.value}`
		);
	}

	function toggle(value: string) {
		selected = selected.includes(value)
			? selected.filter((entry) => entry !== value)
			: [...selected, value];
	}

	async function save() {
		pending = true;
		feedback = '';

		try {
			await upsertVariant({
				productId: product.id,
				variant: {
					sku: sku.trim(),
					label: label.trim(),
					priceCents: toCents(price),
					compareAtPriceCents: compareAt === '' ? null : toCents(compareAt),
					stock: toInteger(stock),
					available,
					position: product.variants.length,
					attributes: selected.map((token) => {
						const separator = token.indexOf(':');
						return { attributeKey: token.slice(0, separator), value: token.slice(separator + 1) };
					})
				}
			});
			reset();
			feedback = 'Variante enregistrée.';
		} catch (error) {
			feedback = toMessage(error, "L'enregistrement a échoué.");
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if product.variants.length > 0}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>SKU</TableHead>
					<TableHead>Libellé</TableHead>
					<TableHead class="text-right">Prix</TableHead>
					<TableHead class="text-right">Stock</TableHead>
					<TableHead class="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each product.variants as variant (variant.id)}
					<TableRow>
						<TableCell class="font-mono text-xs">{variant.sku}</TableCell>
						<TableCell>
							{variant.label}
							{#if !variant.available}
								<span class="text-xs text-muted-foreground"> · retirée</span>
							{/if}
						</TableCell>
						<TableCell class="text-right tabular-nums">
							{formatPrice(variant.priceCents)}
						</TableCell>
						<TableCell class="text-right tabular-nums">{variant.stock}</TableCell>
						<TableCell class="text-right">
							<div class="flex justify-end gap-2">
								<Button size="sm" variant="outline" onclick={() => edit(variant)}>Modifier</Button>
								<Button
									size="sm"
									variant="destructive"
									onclick={() => deleteVariant({ productId: product.id, variantId: variant.id })}
								>
									Supprimer
								</Button>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	{:else}
		<p class="text-sm text-muted-foreground">
			Aucune variante : le produit ne peut pas être ajouté au panier tant qu’il n’en a pas.
		</p>
	{/if}

	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border p-4">
		<div class="text-sm font-medium">
			Ajouter ou modifier une variante <span class="font-normal text-muted-foreground">
				(un SKU existant est mis à jour)
			</span>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Label for="variant-sku">SKU</Label>
				<Input id="variant-sku" bind:value={sku} placeholder="BY-COL-42" />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="variant-label">Libellé</Label>
				<Input id="variant-label" bind:value={label} placeholder="42 cm" />
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<div class="flex flex-col gap-2">
				<Label for="variant-price">Prix (€)</Label>
				<Input id="variant-price" type="number" step="0.01" min="0" bind:value={price} />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="variant-compare">Prix barré (€)</Label>
				<Input id="variant-compare" type="number" step="0.01" min="0" bind:value={compareAt} />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="variant-stock">Stock</Label>
				<Input id="variant-stock" type="number" min="0" bind:value={stock} />
			</div>
		</div>

		{#each axes as axis (axis.key)}
			<div class="flex flex-col gap-2">
				<Label>{axis.label}</Label>
				<div class="flex flex-wrap gap-2">
					{#each axis.values as value (value.id)}
						{@const token = `${axis.key}:${value.value}`}
						<Button
							variant={selected.includes(token) ? 'default' : 'outline'}
							size="sm"
							onclick={() => toggle(token)}
						>
							{value.label}
						</Button>
					{/each}
				</div>
			</div>
		{/each}

		<Label class="cursor-pointer">
			<Checkbox bind:checked={available} />
			Proposée à la vente
		</Label>

		<div class="flex items-center gap-3">
			<Button onclick={save} disabled={pending || sku.trim() === '' || label.trim() === ''}>
				{pending ? 'Enregistrement…' : 'Enregistrer la variante'}
			</Button>
			<Button variant="ghost" onclick={reset}>Vider le formulaire</Button>
			{#if feedback}
				<span class="text-sm text-muted-foreground">{feedback}</span>
			{/if}
		</div>
	</div>
</div>
