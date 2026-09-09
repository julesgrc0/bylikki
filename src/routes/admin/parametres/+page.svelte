<script lang="ts">
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
	import { Textarea } from '#lib/client/ui/shadcn/textarea';
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice, toCents, toInteger } from '#lib/client/utils/money';
	import { SHIPPING_COUNTRIES, type SiteSettings } from '#lib/client/validation/settings';
	import {
		getSettings,
		saveAnnouncement,
		saveHome,
		saveLoyalty,
		saveShipping,
		saveThresholds,
		saveVacation
	} from '#lib/remote/settings.remote';

	const settings = $derived(await getSettings());

	let feedback = $state('');
	let pending = $state('');

	/** Chaque carte enregistre sa rubrique seule : une erreur n'en perd pas d'autres. */
	async function run(section: string, action: () => Promise<unknown>) {
		pending = section;
		feedback = '';

		try {
			await action();
			feedback = 'Réglages enregistrés.';
		} catch (error) {
			feedback = toMessage(error, "Ces réglages n'ont pas pu être enregistrés.");
		} finally {
			pending = '';
		}
	}

	// --- livraison
	let flat = $state<string | number>('');
	let threshold = $state<string | number>('');
	let countries = $state<string[]>([]);

	// --- bandeau
	let announcementEnabled = $state(false);
	let announcementText = $state('');
	let announcementTone = $state<SiteSettings['announcement']['tone']>('pink');

	// --- vacances
	let vacationEnabled = $state(false);
	let vacationMessage = $state('');

	// --- seuils
	let lowStock = $state<string | number>('');
	let preparationDays = $state<string | number>('');

	// --- fidelite
	let stacksWithCode = $state(false);

	// --- accueil
	let slidesDraft = $state('');

	let loaded = $state(false);

	$effect(() => {
		if (loaded) {
			return;
		}

		flat = settings.shipping.flatCents / 100;
		threshold = settings.shipping.freeThresholdCents / 100;
		countries = [...settings.shipping.countries];
		announcementEnabled = settings.announcement.enabled;
		announcementText = settings.announcement.text;
		announcementTone = settings.announcement.tone;
		vacationEnabled = settings.vacation.enabled;
		vacationMessage = settings.vacation.message;
		lowStock = settings.thresholds.lowStock;
		preparationDays = settings.thresholds.preparationDays;
		stacksWithCode = settings.loyalty.stacksWithCode;
		slidesDraft = settings.home.slides
			.map((slide) =>
				[slide.kicker, slide.title, slide.desc, slide.cta, describeTarget(slide.target)].join(' | ')
			)
			.join('\n');
		loaded = true;
	});

	function describeTarget(target: SiteSettings['home']['slides'][number]['target']) {
		switch (target.kind) {
			case 'category':
				return `categorie:${target.slug}`;
			case 'search':
				return `recherche:${target.query}`;
			case 'product':
				return `produit:${target.slug}`;
			case 'atelier':
				return 'atelier';
			case 'none':
				return 'aucun';
		}
	}

	/** `catégorie:bijoux`, `recherche:etoile`, `produit:mon-slug`, `atelier` ou `aucun`. */
	function parseTarget(raw: string): SiteSettings['home']['slides'][number]['target'] {
		const [kind, ...rest] = raw.trim().split(':');
		const value = rest.join(':').trim();

		if (kind === 'categorie' && value) {
			return { kind: 'category', slug: value };
		}
		if (kind === 'recherche') {
			return { kind: 'search', query: value };
		}
		if (kind === 'produit' && value) {
			return { kind: 'product', slug: value };
		}
		if (kind === 'atelier') {
			return { kind: 'atelier' };
		}

		return { kind: 'none' };
	}

	function toggleCountry(code: string, checked: boolean) {
		countries = checked
			? [...new Set([...countries, code])]
			: countries.filter((candidate) => candidate !== code);
	}
</script>

<svelte:head>
	<title>Paramètres — Administration BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Paramètres</h1>
		<p class="text-sm text-muted-foreground">
			Ces réglages s'appliquent immédiatement sur la boutique, sans redéploiement.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium">{feedback}</p>
	{/if}

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Livraison</CardTitle>
				<CardDescription>
					Forfait appliqué au panier et seuil au-delà duquel la livraison est offerte.
				</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<Label for="flat">Forfait (€)</Label>
						<Input id="flat" type="number" step="0.01" min="0" bind:value={flat} />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="threshold">Gratuite à partir de (€)</Label>
						<Input id="threshold" type="number" step="0.01" min="0" bind:value={threshold} />
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<Label>Pays desservis</Label>
					{#each SHIPPING_COUNTRIES as country (country.value)}
						<label class="flex items-center gap-2 text-sm">
							<Checkbox
								checked={countries.includes(country.value)}
								onCheckedChange={(checked) => toggleCountry(country.value, checked === true)}
							/>
							{country.label}
							{#if country.value === 'CH'}
								<span class="text-xs text-muted-foreground">— hors UE, formalités douanières</span>
							{/if}
						</label>
					{/each}
				</div>

				<p class="text-xs text-muted-foreground">
					Aperçu : un panier de 30 € paierait
					{formatPrice(toCents(threshold) > 3000 ? toCents(flat) : 0)} de livraison.
				</p>

				<Button
					disabled={pending === 'shipping'}
					onclick={() =>
						run('shipping', () =>
							saveShipping({
								flatCents: toCents(flat),
								freeThresholdCents: toCents(threshold),
								countries: countries as SiteSettings['shipping']['countries']
							})
						)}
				>
					Enregistrer la livraison
				</Button>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Bandeau d'annonce</CardTitle>
				<CardDescription>Affiché tout en haut de la boutique, sur chaque page.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<label class="flex items-center gap-2 text-sm">
					<Checkbox
						checked={announcementEnabled}
						onCheckedChange={(checked) => (announcementEnabled = checked === true)}
					/>
					Afficher le bandeau
				</label>

				<div class="flex flex-col gap-1.5">
					<Label for="announcement">Message</Label>
					<Input id="announcement" maxlength={140} bind:value={announcementText} />
				</div>

				<div class="flex flex-col gap-1.5">
					<Label for="tone">Couleur</Label>
					<select
						id="tone"
						bind:value={announcementTone}
						class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
					>
						<option value="pink">Rose</option>
						<option value="yellow">Jaune</option>
						<option value="blue">Bleu</option>
						<option value="green">Vert</option>
					</select>
				</div>

				<Button
					disabled={pending === 'announcement'}
					onclick={() =>
						run('announcement', () =>
							saveAnnouncement({
								enabled: announcementEnabled,
								text: announcementText,
								tone: announcementTone,
								target: { kind: 'none' }
							})
						)}
				>
					Enregistrer le bandeau
				</Button>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Mode vacances</CardTitle>
				<CardDescription>
					La boutique reste consultable, mais aucun paiement ne peut aboutir.
				</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<label class="flex items-center gap-2 text-sm">
					<Checkbox
						checked={vacationEnabled}
						onCheckedChange={(checked) => (vacationEnabled = checked === true)}
					/>
					Suspendre les commandes
				</label>

				<div class="flex flex-col gap-1.5">
					<Label for="vacation">Message affiché à la cliente</Label>
					<Textarea id="vacation" rows={3} maxlength={280} bind:value={vacationMessage} />
				</div>

				<Button
					disabled={pending === 'vacation'}
					onclick={() =>
						run('vacation', () =>
							saveVacation({ enabled: vacationEnabled, message: vacationMessage })
						)}
				>
					Enregistrer le mode vacances
				</Button>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Seuils et fidélité</CardTitle>
				<CardDescription>Alerte de stock bas et cumul des remises.</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<Label for="low-stock">Stock bas à partir de</Label>
						<Input id="low-stock" type="number" min="0" max="100" bind:value={lowStock} />
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="preparation">Préparation (jours)</Label>
						<Input id="preparation" type="number" min="0" max="60" bind:value={preparationDays} />
					</div>
				</div>

				<Button
					disabled={pending === 'thresholds'}
					onclick={() =>
						run('thresholds', () =>
							saveThresholds({
								lowStock: toInteger(lowStock),
								preparationDays: toInteger(preparationDays)
							})
						)}
				>
					Enregistrer les seuils
				</Button>

				<label class="flex items-center gap-2 border-t pt-4 text-sm">
					<Checkbox
						checked={stacksWithCode}
						onCheckedChange={(checked) => (stacksWithCode = checked === true)}
					/>
					Cumuler la remise fidélité avec un code de réduction
				</label>
				<p class="text-xs text-muted-foreground">
					Décoché, c'est la remise la plus avantageuse pour la cliente qui s'applique.
				</p>

				<Button
					variant="secondary"
					disabled={pending === 'loyalty'}
					onclick={() => run('loyalty', () => saveLoyalty({ stacksWithCode }))}
				>
					Enregistrer la fidélité
				</Button>
			</CardContent>
		</Card>

		<Card class="lg:col-span-2">
			<CardHeader>
				<CardTitle>Carrousel d'accueil</CardTitle>
				<CardDescription>
					Une diapositive par ligne, cinq champs séparés par « | » : accroche, titre, description,
					bouton, destination. La destination s'écrit
					<code>categorie:bijoux</code>, <code>recherche:etoile</code>,
					<code>produit:mon-slug</code>, <code>atelier</code> ou <code>aucun</code>.
				</CardDescription>
			</CardHeader>
			<CardContent class="flex flex-col gap-4">
				<Textarea rows={6} bind:value={slidesDraft} class="font-mono text-xs" />

				<Button
					disabled={pending === 'home'}
					onclick={() =>
						run('home', () =>
							saveHome({
								slides: slidesDraft
									.split('\n')
									.map((line) => line.trim())
									.filter(Boolean)
									.map((line) => {
										const [kicker = '', title = '', desc = '', cta = '', target = 'aucun'] = line
											.split('|')
											.map((part) => part.trim());

										return { kicker, title, desc, cta, target: parseTarget(target) };
									})
							})
						)}
				>
					Enregistrer le carrousel
				</Button>
			</CardContent>
		</Card>
	</div>
</div>
