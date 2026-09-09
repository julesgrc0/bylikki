<script lang="ts">
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Checkbox } from '#lib/client/ui/shadcn/checkbox';
	import { Input } from '#lib/client/ui/shadcn/input';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice, toCents, toInteger } from '#lib/client/utils/money';
	import { upsertCustomization, type getAdminProduct } from '#lib/remote/admin.remote';

	type Product = NonNullable<Awaited<ReturnType<typeof getAdminProduct>>>;

	let { product }: { product: Product } = $props();

	let key = $state('');
	let label = $state('');
	let helpText = $state('');
	let kind = $state<'TEXT' | 'SELECT' | 'COLOR'>('TEXT');
	let required = $state(false);
	let maxLength = $state<string | number>('');
	let priceDelta = $state<string | number>(0);
	/** Un choix par ligne, au format `valeur | libellé | supplément €`. */
	let choicesText = $state('');
	let pending = $state(false);
	let feedback = $state('');

	const choicesPlaceholder = 'dore | Doré | 0\nargente | Argenté | 2';

	function edit(option: Product['customizations'][number]) {
		key = option.key;
		label = option.label;
		helpText = option.helpText ?? '';
		kind = option.kind;
		required = option.required;
		maxLength = option.maxLength ?? '';
		priceDelta = option.priceDeltaCents / 100;
		choicesText = option.choices
			.map((choice) => `${choice.value} | ${choice.label} | ${choice.priceDeltaCents / 100}`)
			.join('\n');
	}

	function parseChoices() {
		return choicesText
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const [value, choiceLabel, delta] = line.split('|').map((part) => part.trim());
				return {
					value: value ?? '',
					label: choiceLabel || value || '',
					hexColor: null,
					priceDeltaCents: toCents(delta ?? '0')
				};
			});
	}

	async function save() {
		pending = true;
		feedback = '';

		try {
			await upsertCustomization({
				productId: product.id,
				option: {
					key: key.trim(),
					label: label.trim(),
					helpText: helpText.trim() === '' ? null : helpText.trim(),
					kind,
					required,
					maxLength: maxLength === '' ? null : toInteger(maxLength),
					priceDeltaCents: toCents(priceDelta),
					position: product.customizations.length,
					choices: kind === 'TEXT' ? [] : parseChoices()
				}
			});
			feedback = 'Option enregistrée.';
		} catch (error) {
			feedback = toMessage(error, "L'enregistrement a échoué.");
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if product.customizations.length > 0}
		<ul class="m-0 flex list-none flex-col gap-3 p-0">
			{#each product.customizations as option (option.id)}
				<li class="flex items-start justify-between gap-4 rounded-lg border p-4">
					<div>
						<div class="font-medium">
							{option.label}
							<span class="text-xs text-muted-foreground">
								· {option.kind}{option.required ? ' · obligatoire' : ''}
								{#if option.priceDeltaCents > 0}
									· +{formatPrice(option.priceDeltaCents)}
								{/if}
							</span>
						</div>
						{#if option.choices.length > 0}
							<div class="mt-1 text-sm text-muted-foreground">
								{option.choices.map((choice) => choice.label).join(', ')}
							</div>
						{/if}
					</div>
					<Button size="sm" variant="outline" onclick={() => edit(option)}>Modifier</Button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-muted-foreground">Aucune option de personnalisation.</p>
	{/if}

	<div class="flex max-w-3xl flex-col gap-4 rounded-lg border p-4">
		<div class="text-sm font-medium">
			Ajouter ou modifier une option
			<span class="font-normal text-muted-foreground">(une clé existante est mise à jour)</span>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div class="flex flex-col gap-2">
				<Label for="option-key">Clé</Label>
				<Input id="option-key" bind:value={key} placeholder="gravure" />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="option-label">Libellé</Label>
				<Input id="option-label" bind:value={label} placeholder="Gravure" />
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-3">
			<div class="flex flex-col gap-2">
				<Label for="option-kind">Type</Label>
				<select
					id="option-kind"
					bind:value={kind}
					class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
				>
					<option value="TEXT">Texte libre</option>
					<option value="SELECT">Liste de choix</option>
					<option value="COLOR">Couleur</option>
				</select>
			</div>
			<div class="flex flex-col gap-2">
				<Label for="option-max">Longueur max (texte)</Label>
				<Input id="option-max" type="number" min="1" bind:value={maxLength} />
			</div>
			<div class="flex flex-col gap-2">
				<Label for="option-price">Supplément (€)</Label>
				<Input id="option-price" type="number" step="0.01" min="0" bind:value={priceDelta} />
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<Label for="option-help">Aide affichée sous le champ</Label>
			<Input id="option-help" bind:value={helpText} placeholder="3 lettres maximum" />
		</div>

		{#if kind !== 'TEXT'}
			<div class="flex flex-col gap-2">
				<Label for="option-choices">Choix (un par ligne : valeur | libellé | supplément €)</Label>
				<textarea
					id="option-choices"
					rows="4"
					bind:value={choicesText}
					placeholder={choicesPlaceholder}
					class="rounded-md border border-input bg-transparent p-3 font-mono text-sm"></textarea>
			</div>
		{/if}

		<Label class="cursor-pointer">
			<Checkbox bind:checked={required} />
			Obligatoire pour commander
		</Label>

		<div class="flex items-center gap-3">
			<Button onclick={save} disabled={pending || key.trim() === '' || label.trim() === ''}>
				{pending ? 'Enregistrement…' : 'Enregistrer l’option'}
			</Button>
			{#if feedback}
				<span class="text-sm text-muted-foreground">{feedback}</span>
			{/if}
		</div>
	</div>
</div>
