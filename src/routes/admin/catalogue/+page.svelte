<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/client/ui/shadcn/card';
	import { Checkbox } from '#lib/client/ui/shadcn/checkbox';
	import { Input } from '#lib/client/ui/shadcn/input';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { toMessage } from '#lib/client/utils/errors';
	import { toInteger } from '#lib/client/utils/money';
	import {
		getCatalogueMeta,
		removeAttribute,
		removeCategory,
		upsertAttribute,
		upsertCategory
	} from '#lib/remote/admin.remote';

	const meta = $derived(await getCatalogueMeta());

	let categorySlug = $state('');
	let categoryName = $state('');
	let categoryPosition = $state<string | number>(0);

	let attributeKey = $state('');
	let attributeLabel = $state('');
	let attributeKind = $state<'SELECT' | 'COLOR' | 'TEXT' | 'NUMBER' | 'BOOLEAN'>('SELECT');
	let attributeUnit = $state('');
	let attributeFilterable = $state(true);
	let attributeVariantAxis = $state(false);
	/** Une valeur par ligne, au format `valeur | libellé | #hexa`. */
	let attributeValues = $state('');

	let feedback = $state('');

	const valuesPlaceholder = 'rose | Rose | #F0369B\njaune | Jaune | #FFDE59';

	function parseValues() {
		return attributeValues
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const [value, label, hex] = line.split('|').map((part) => part.trim());
				return {
					value: value ?? '',
					label: label || value || '',
					hexColor: hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null
				};
			});
	}

	function editAttribute(
		attribute: Awaited<ReturnType<typeof getCatalogueMeta>>['attributes'][number]
	) {
		attributeKey = attribute.key;
		attributeLabel = attribute.label;
		attributeKind = attribute.kind;
		attributeUnit = attribute.unit ?? '';
		attributeFilterable = attribute.filterable;
		attributeVariantAxis = attribute.variantAxis;
		attributeValues = attribute.values
			.map(
				(value) => `${value.value} | ${value.label}${value.hexColor ? ` | ${value.hexColor}` : ''}`
			)
			.join('\n');
	}

	async function saveCategory() {
		feedback = '';

		try {
			await upsertCategory({
				slug: categorySlug.trim(),
				name: categoryName.trim(),
				description: null,
				position: toInteger(categoryPosition),
				parentSlug: null
			});
			categorySlug = '';
			categoryName = '';
		} catch (error) {
			feedback = toMessage(error, "L'enregistrement a échoué.");
		}
	}

	async function saveAttribute() {
		feedback = '';

		try {
			await upsertAttribute({
				key: attributeKey.trim(),
				label: attributeLabel.trim(),
				kind: attributeKind,
				unit: attributeUnit.trim() === '' ? null : attributeUnit.trim(),
				filterable: attributeFilterable,
				variantAxis: attributeVariantAxis,
				position: 0,
				values: parseValues()
			});
		} catch (error) {
			feedback = toMessage(error, "L'enregistrement a échoué.");
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Catalogue</h1>
		<p class="text-sm text-muted-foreground">
			Univers et critères. Ajouter un critère ici suffit à le rendre filtrable en boutique — aucune
			migration n’est nécessaire.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium text-destructive">{feedback}</p>
	{/if}

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Univers</CardTitle>
				<CardDescription>Les familles affichées dans le menu et les filtres</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each meta.categories as category (category.slug)}
						<li class="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
							<div>
								<div class="text-sm font-medium">{category.name}</div>
								<div class="text-xs text-muted-foreground">
									/{category.slug} · {category._count.products} produit(s)
								</div>
							</div>
							<Button
								size="sm"
								variant="outline"
								disabled={category._count.products > 0}
								onclick={() => removeCategory(category.slug)}
							>
								Supprimer
							</Button>
						</li>
					{/each}
					{#if meta.categories.length === 0}
						<li class="text-sm text-muted-foreground">Aucun univers.</li>
					{/if}
				</ul>

				<div class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="flex flex-col gap-2">
							<Label for="category-slug">Slug</Label>
							<Input id="category-slug" bind:value={categorySlug} placeholder="bijoux" />
						</div>
						<div class="flex flex-col gap-2">
							<Label for="category-name">Nom</Label>
							<Input id="category-name" bind:value={categoryName} placeholder="Bijoux" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="category-position">Position</Label>
						<Input id="category-position" type="number" min="0" bind:value={categoryPosition} />
					</div>
					<Button
						onclick={saveCategory}
						disabled={categorySlug.trim() === '' || categoryName.trim() === ''}
					>
						Enregistrer l’univers
					</Button>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Critères</CardTitle>
				<CardDescription>Couleur, taille, matière… et leurs valeurs</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<ul class="m-0 flex list-none flex-col gap-2 p-0">
					{#each meta.attributes as attribute (attribute.key)}
						<li class="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
							<div>
								<div class="flex items-center gap-2 text-sm font-medium">
									{attribute.label}
									<Badge variant="outline">{attribute.kind}</Badge>
									{#if attribute.variantAxis}
										<Badge variant="secondary">axe de variante</Badge>
									{/if}
								</div>
								<div class="text-xs text-muted-foreground">
									{attribute.values.map((value) => value.label).join(', ') || 'aucune valeur'}
								</div>
							</div>
							<div class="flex gap-2">
								<Button size="sm" variant="outline" onclick={() => editAttribute(attribute)}>
									Modifier
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onclick={() => removeAttribute(attribute.key)}
								>
									Supprimer
								</Button>
							</div>
						</li>
					{/each}
					{#if meta.attributes.length === 0}
						<li class="text-sm text-muted-foreground">Aucun critère.</li>
					{/if}
				</ul>

				<div class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="flex flex-col gap-2">
							<Label for="attribute-key">Clé</Label>
							<Input id="attribute-key" bind:value={attributeKey} placeholder="couleur" />
						</div>
						<div class="flex flex-col gap-2">
							<Label for="attribute-label">Libellé</Label>
							<Input id="attribute-label" bind:value={attributeLabel} placeholder="Couleur" />
						</div>
					</div>

					<div class="grid gap-3 sm:grid-cols-2">
						<div class="flex flex-col gap-2">
							<Label for="attribute-kind">Type</Label>
							<select
								id="attribute-kind"
								bind:value={attributeKind}
								class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
							>
								<option value="SELECT">Liste</option>
								<option value="COLOR">Couleur</option>
								<option value="TEXT">Texte</option>
								<option value="NUMBER">Nombre</option>
								<option value="BOOLEAN">Oui / non</option>
							</select>
						</div>
						<div class="flex flex-col gap-2">
							<Label for="attribute-unit">Unité</Label>
							<Input id="attribute-unit" bind:value={attributeUnit} placeholder="cm" />
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="attribute-values">Valeurs (une par ligne : valeur | libellé | #hexa)</Label>
						<textarea
							id="attribute-values"
							rows="4"
							bind:value={attributeValues}
							placeholder={valuesPlaceholder}
							class="rounded-md border border-input bg-transparent p-3 font-mono text-sm"
						></textarea>
					</div>

					<div class="flex flex-wrap gap-6">
						<Label class="cursor-pointer">
							<Checkbox bind:checked={attributeFilterable} />
							Filtrable en recherche
						</Label>
						<Label class="cursor-pointer">
							<Checkbox bind:checked={attributeVariantAxis} />
							Compose les variantes
						</Label>
					</div>

					<Button
						onclick={saveAttribute}
						disabled={attributeKey.trim() === '' || attributeLabel.trim() === ''}
					>
						Enregistrer le critère
					</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
