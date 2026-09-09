<script lang="ts">
	import FunnelChart from '#lib/client/ui/admin/FunnelChart.svelte';
	import TrendChart from '#lib/client/ui/admin/TrendChart.svelte';
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/client/ui/shadcn/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/client/ui/shadcn/table';
	import { formatPrice } from '#lib/client/utils/money';
	import { getStats } from '#lib/remote/admin.remote';
	import { resolve } from '$app/paths';

	const stats = await getStats();

	const numberFormatter = new Intl.NumberFormat('fr-FR');

	const tiles = $derived([
		{ label: 'Chiffre d’affaires encaissé', value: formatPrice(stats.revenueCents) },
		{ label: 'Commandes payées', value: numberFormatter.format(stats.paidOrders) },
		{ label: 'Panier moyen', value: formatPrice(stats.averageBasketCents) },
		{ label: 'Comptes', value: `${numberFormatter.format(stats.totalAccounts)}` }
	]);

	const todo = $derived(
		[
			stats.ordersToPrepare > 0
				? {
						label: `${stats.ordersToPrepare} commande(s) à préparer`,
						href: resolve('/admin/commandes')
					}
				: null,
			stats.pendingReviews > 0
				? { label: `${stats.pendingReviews} avis à modérer`, href: resolve('/admin/avis') }
				: null,
			stats.lowStock.length > 0
				? {
						label: `${stats.lowStock.length} variante(s) en stock bas`,
						href: resolve('/admin/produits')
					}
				: null
		].filter((entry) => entry !== null)
	);
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
		<p class="text-sm text-muted-foreground">
			Les 30 derniers jours : {numberFormatter.format(stats.trendOrders)} commande(s) pour
			{formatPrice(stats.trendRevenueCents)} encaissés.
		</p>
	</div>

	{#if todo.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each todo as entry (entry.label)}
				<Button href={entry.href} variant="outline" size="sm">{entry.label}</Button>
			{/each}
		</div>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each tiles as tile (tile.label)}
			<Card>
				<CardHeader>
					<CardDescription>{tile.label}</CardDescription>
					<CardTitle class="text-2xl tabular-nums">{tile.value}</CardTitle>
				</CardHeader>
			</Card>
		{/each}
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Parcours d’achat</CardTitle>
				<CardDescription>
					30 derniers jours. Mesure agrégée, sans cookie ni identifiant.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<FunnelChart steps={stats.funnel.steps} conversion={stats.funnel.conversion} />
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Recherches sans résultat</CardTitle>
				<CardDescription>Ce que les visiteuses cherchent et ne trouvent pas.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if stats.searchMisses.length === 0}
					<p class="text-sm text-muted-foreground">
						Aucune recherche restée sans résultat sur la période.
					</p>
				{:else}
					<ul class="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
						{#each stats.searchMisses as miss (miss.term)}
							<li class="flex items-baseline justify-between gap-3">
								<span class="truncate">{miss.term}</span>
								<span class="shrink-0 text-muted-foreground tabular-nums">
									{numberFormatter.format(miss.count)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Fiches vues</CardTitle>
				<CardDescription>Consultations de fiches produit, par jour</CardDescription>
			</CardHeader>
			<CardContent>
				<TrendChart
					title="Fiches vues par jour"
					points={stats.views}
					format={(value) => numberFormatter.format(value)}
				/>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Chiffre d’affaires</CardTitle>
				<CardDescription>Commandes payées, par jour</CardDescription>
			</CardHeader>
			<CardContent>
				<TrendChart
					title="Chiffre d’affaires par jour"
					points={stats.trend.map((day) => ({ date: day.date, value: day.revenueCents }))}
					format={formatPrice}
				/>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle>Commandes</CardTitle>
				<CardDescription>Toutes commandes créées, par jour</CardDescription>
			</CardHeader>
			<CardContent>
				<TrendChart
					title="Commandes par jour"
					points={stats.trend.map((day) => ({ date: day.date, value: day.orders }))}
					format={(value) => numberFormatter.format(value)}
				/>
			</CardContent>
		</Card>
	</div>

	<div class="grid gap-4 lg:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle>Meilleures ventes</CardTitle>
				<CardDescription>Depuis l’ouverture, commandes payées</CardDescription>
			</CardHeader>
			<CardContent>
				{#if stats.topProducts.length === 0}
					<p class="text-sm text-muted-foreground">Aucune vente pour le moment.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produit</TableHead>
								<TableHead class="text-right">Quantité</TableHead>
								<TableHead class="text-right">CA</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each stats.topProducts as product (product.slug)}
								<TableRow>
									<TableCell class="font-medium">{product.name}</TableCell>
									<TableCell class="text-right tabular-nums">{product.quantity}</TableCell>
									<TableCell class="text-right tabular-nums">
										{formatPrice(product.revenueCents)}
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
				<CardTitle>Stocks à surveiller</CardTitle>
				<CardDescription>Variantes disponibles à 3 exemplaires ou moins</CardDescription>
			</CardHeader>
			<CardContent>
				{#if stats.lowStock.length === 0}
					<p class="text-sm text-muted-foreground">Tous les stocks sont confortables.</p>
				{:else}
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Produit</TableHead>
								<TableHead>Variante</TableHead>
								<TableHead class="text-right">Stock</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each stats.lowStock as variant (variant.id)}
								<TableRow>
									<TableCell class="font-medium">{variant.product.name}</TableCell>
									<TableCell class="text-muted-foreground">{variant.label}</TableCell>
									<TableCell class="text-right">
										<Badge variant={variant.stock === 0 ? 'destructive' : 'secondary'}>
											{variant.stock}
										</Badge>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Répartition</CardTitle>
			<CardDescription>Commandes par statut et produits par état</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-wrap gap-2">
			{#each Object.entries(stats.ordersByStatus) as [status, count] (status)}
				<Badge variant="outline">{status} · {count}</Badge>
			{/each}
			{#each Object.entries(stats.productsByStatus) as [status, count] (status)}
				<Badge variant="secondary">{status} · {count}</Badge>
			{/each}
		</CardContent>
	</Card>
</div>
