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
	import { discountKindLabels, discountKinds } from '#lib/client/validation/discount';
	import {
		getDiscounts,
		getLoyaltyTiers,
		removeDiscount,
		removeLoyaltyTier,
		upsertDiscount,
		upsertLoyaltyTier
	} from '#lib/remote/discount.remote';

	const [discounts, tiers] = $derived(await Promise.all([getDiscounts(), getLoyaltyTiers()]));

	let feedback = $state('');
	let pending = $state('');

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

	async function run(key: string, action: () => Promise<unknown>, success: string) {
		pending = key;
		feedback = '';

		try {
			await action();
			feedback = success;
		} catch (error) {
			feedback = toMessage(error, "L'opération a échoué.");
		} finally {
			pending = '';
		}
	}

	// --- formulaire de code
	let code = $state('');
	let label = $state('');
	let kind = $state<(typeof discountKinds)[number]>('PERCENTAGE');
	let value = $state<string | number>(10);
	let expiresAt = $state('');
	let maxUses = $state<string | number>('');
	let maxUsesPerUser = $state<string | number>(1);
	let minSubtotal = $state<string | number>('');

	// --- formulaire de palier
	let tierName = $state('');
	let tierThreshold = $state<string | number>('');
	let tierPercent = $state<string | number>(5);
	let tierFreeShipping = $state(false);
	let tierColor = $state('#FFDE59');

	/** Un pourcentage s'exprime en points, un montant fixe en euros. */
	const valueForKind = $derived(kind === 'PERCENTAGE' ? toInteger(value) : toCents(value));

	function optionalCount(raw: string | number) {
		const parsed = toInteger(raw);

		return String(raw).trim() === '' || parsed <= 0 ? null : parsed;
	}

	function describeLimit(discount: (typeof discounts)[number]) {
		const parts: string[] = [];

		if (discount.expiresAt) {
			parts.push(`jusqu'au ${dateFormatter.format(discount.expiresAt)}`);
		}
		if (discount.maxUses !== null) {
			parts.push(`${discount.usedCount}/${discount.maxUses} utilisations`);
		} else {
			parts.push(`${discount.usedCount} utilisations`);
		}
		if (discount.minSubtotalCents > 0) {
			parts.push(`dès ${formatPrice(discount.minSubtotalCents)}`);
		}

		return parts.join(' · ');
	}

	function describeValue(discount: (typeof discounts)[number]) {
		if (discount.kind === 'PERCENTAGE') {
			return `−${discount.value} %`;
		}
		if (discount.kind === 'FIXED_AMOUNT') {
			return `−${formatPrice(discount.value)}`;
		}

		return 'Livraison offerte';
	}
</script>

<svelte:head>
	<title>Promotions — Administration BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Promotions</h1>
		<p class="text-sm text-muted-foreground">
			Codes de réduction et paliers de fidélité. Un code déjà utilisé se désactive, il ne se
			supprime pas.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium">{feedback}</p>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Nouveau code</CardTitle>
			<CardDescription>Laisse une limite vide pour qu'elle ne s'applique pas.</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class="flex flex-col gap-1.5">
					<Label for="code">Code</Label>
					<Input id="code" bind:value={code} placeholder="BIENVENUE" class="uppercase" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="label">Libellé affiché</Label>
					<Input id="label" bind:value={label} placeholder="Bienvenue −10 %" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="kind">Type</Label>
					<select
						id="kind"
						bind:value={kind}
						class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						{#each discountKinds as entry (entry)}
							<option value={entry}>{discountKindLabels[entry]}</option>
						{/each}
					</select>
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="value">
						{kind === 'PERCENTAGE' ? 'Pourcentage' : kind === 'FIXED_AMOUNT' ? 'Montant (€)' : '—'}
					</Label>
					<Input
						id="value"
						type="number"
						min="0"
						step={kind === 'FIXED_AMOUNT' ? '0.01' : '1'}
						disabled={kind === 'FREE_SHIPPING'}
						bind:value
					/>
				</div>
			</div>

			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div class="flex flex-col gap-1.5">
					<Label for="expires">Expire le</Label>
					<Input id="expires" type="date" bind:value={expiresAt} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="max-uses">Utilisations max</Label>
					<Input id="max-uses" type="number" min="1" bind:value={maxUses} placeholder="illimité" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="max-per-user">Par personne</Label>
					<Input id="max-per-user" type="number" min="1" bind:value={maxUsesPerUser} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="min-subtotal">Minimum d'achat (€)</Label>
					<Input
						id="min-subtotal"
						type="number"
						min="0"
						step="0.01"
						bind:value={minSubtotal}
						placeholder="aucun"
					/>
				</div>
			</div>

			<Button
				disabled={pending === 'discount' || code.trim().length < 3 || label.trim().length < 2}
				onclick={() =>
					run(
						'discount',
						async () => {
							await upsertDiscount({
								code,
								label,
								kind,
								value: kind === 'FREE_SHIPPING' ? 0 : valueForKind,
								active: true,
								startsAt: null,
								expiresAt: expiresAt === '' ? null : new Date(`${expiresAt}T23:59:59`),
								maxUses: optionalCount(maxUses),
								maxUsesPerUser: optionalCount(maxUsesPerUser),
								minSubtotalCents: toCents(minSubtotal)
							});
							code = '';
							label = '';
							expiresAt = '';
							maxUses = '';
							minSubtotal = '';
						},
						'Code enregistré.'
					)}
			>
				Créer le code
			</Button>
		</CardContent>
	</Card>

	<Card>
		<CardHeader><CardTitle>Codes existants</CardTitle></CardHeader>
		<CardContent>
			{#if discounts.length === 0}
				<p class="text-sm text-muted-foreground">Aucun code pour l'instant.</p>
			{:else}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Code</TableHead>
							<TableHead>Remise</TableHead>
							<TableHead>Limites</TableHead>
							<TableHead>État</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each discounts as discount (discount.id)}
							<TableRow>
								<TableCell class="font-mono text-xs">
									{discount.code}
									<div class="text-muted-foreground">{discount.label}</div>
								</TableCell>
								<TableCell>{describeValue(discount)}</TableCell>
								<TableCell class="text-muted-foreground">{describeLimit(discount)}</TableCell>
								<TableCell>
									{#if !discount.active}
										<Badge variant="outline">Désactivé</Badge>
									{:else if discount.expiresAt && discount.expiresAt <= new Date()}
										<Badge variant="outline">Expiré</Badge>
									{:else if discount.maxUses !== null && discount.usedCount >= discount.maxUses}
										<Badge variant="outline">Épuisé</Badge>
									{:else}
										<Badge>Actif</Badge>
									{/if}
								</TableCell>
								<TableCell class="text-right">
									<Button
										size="sm"
										variant="ghost"
										disabled={pending === discount.id}
										onclick={() =>
											run(
												discount.id,
												() =>
													upsertDiscount({
														id: discount.id,
														code: discount.code,
														label: discount.label,
														kind: discount.kind,
														value: discount.value,
														active: !discount.active,
														startsAt: discount.startsAt,
														expiresAt: discount.expiresAt,
														maxUses: discount.maxUses,
														maxUsesPerUser: discount.maxUsesPerUser,
														minSubtotalCents: discount.minSubtotalCents
													}),
												discount.active ? 'Code désactivé.' : 'Code réactivé.'
											)}
									>
										{discount.active ? 'Désactiver' : 'Réactiver'}
									</Button>
									{#if discount._count.redemptions === 0}
										<Button
											size="sm"
											variant="ghost"
											disabled={pending === discount.id}
											onclick={() =>
												run(discount.id, () => removeDiscount(discount.id), 'Code supprimé.')}
										>
											Supprimer
										</Button>
									{/if}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Paliers de fidélité</CardTitle>
			<CardDescription>
				Le palier découle du cumul des achats payés, et redescend en cas de remboursement.
				L'avantage s'applique sans code à saisir.
			</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			{#if tiers.length > 0}
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Palier</TableHead>
							<TableHead>À partir de</TableHead>
							<TableHead>Avantage</TableHead>
							<TableHead class="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each tiers as tier (tier.id)}
							<TableRow>
								<TableCell>
									<span
										class="inline-block rounded-full border px-2.5 py-0.5 text-xs"
										style="background:{tier.color}"
									>
										{tier.name}
									</span>
								</TableCell>
								<TableCell>{formatPrice(tier.thresholdCents)}</TableCell>
								<TableCell class="text-muted-foreground">
									{tier.discountPercent > 0 ? `−${tier.discountPercent} %` : ''}
									{tier.discountPercent > 0 && tier.freeShipping ? ' · ' : ''}
									{tier.freeShipping ? 'livraison offerte' : ''}
								</TableCell>
								<TableCell class="text-right">
									<Button
										size="sm"
										variant="ghost"
										disabled={pending === tier.id}
										onclick={() =>
											run(tier.id, () => removeLoyaltyTier(tier.id), 'Palier supprimé.')}
									>
										Supprimer
									</Button>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			{/if}

			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				<div class="flex flex-col gap-1.5">
					<Label for="tier-name">Nom</Label>
					<Input id="tier-name" bind:value={tierName} placeholder="Bronze" />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="tier-threshold">À partir de (€)</Label>
					<Input id="tier-threshold" type="number" min="0" step="0.01" bind:value={tierThreshold} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="tier-percent">Remise (%)</Label>
					<Input id="tier-percent" type="number" min="0" max="80" bind:value={tierPercent} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="tier-color">Couleur</Label>
					<Input id="tier-color" type="color" bind:value={tierColor} />
				</div>
				<label class="flex items-end gap-2 pb-2 text-sm">
					<Checkbox
						checked={tierFreeShipping}
						onCheckedChange={(checked) => (tierFreeShipping = checked === true)}
					/>
					Livraison offerte
				</label>
			</div>

			<Button
				class="self-start"
				disabled={pending === 'tier' || tierName.trim().length < 2}
				onclick={() =>
					run(
						'tier',
						async () => {
							await upsertLoyaltyTier({
								name: tierName,
								thresholdCents: toCents(tierThreshold),
								discountPercent: toInteger(tierPercent),
								freeShipping: tierFreeShipping,
								color: tierColor,
								position: tiers.length
							});
							tierName = '';
							tierThreshold = '';
						},
						'Palier enregistré.'
					)}
			>
				Ajouter le palier
			</Button>
		</CardContent>
	</Card>
</div>
