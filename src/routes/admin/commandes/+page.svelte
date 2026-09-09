<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Input } from '#lib/client/ui/shadcn/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/client/ui/shadcn/table';
	import { formatPrice } from '#lib/client/utils/money';
	import { buildQueryString } from '#lib/client/utils/search-params';
	import { getAdminOrders } from '#lib/remote/admin.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const statuses = [
		'ALL',
		'PENDING',
		'PAID',
		'PREPARING',
		'SHIPPED',
		'DELIVERED',
		'CANCELLED',
		'REFUNDED'
	] as const;
	type Status = (typeof statuses)[number];

	const statusLabels: Record<Status, string> = {
		ALL: 'Toutes',
		PENDING: 'En attente',
		PAID: 'Payées',
		PREPARING: 'En préparation',
		SHIPPED: 'Expédiées',
		DELIVERED: 'Livrées',
		CANCELLED: 'Annulées',
		REFUNDED: 'Remboursées'
	};

	const filters = $derived({
		query: page.url.searchParams.get('query') ?? '',
		status: (statuses.find((entry) => entry === page.url.searchParams.get('status')) ??
			'ALL') as Status,
		page: Number.parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1
	});

	const orders = $derived(await getAdminOrders(filters));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

	async function apply(patch: Partial<typeof filters>) {
		const next = { ...filters, ...patch };
		const queryString = buildQueryString([
			['query', next.query],
			['status', next.status === 'ALL' ? '' : next.status],
			['page', next.page > 1 ? String(next.page) : '']
		]);
		await goto(resolve(queryString ? `/admin/commandes?${queryString}` : '/admin/commandes'), {
			keepFocus: true,
			noScroll: true
		});
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Commandes</h1>
		<p class="text-sm text-muted-foreground">{orders.total} commande(s)</p>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Input
			class="max-w-xs"
			placeholder="Référence ou e-mail…"
			value={filters.query}
			onchange={(event) => apply({ query: event.currentTarget.value, page: 1 })}
		/>
		{#each statuses as status (status)}
			<Button
				variant={filters.status === status ? 'default' : 'outline'}
				size="sm"
				onclick={() => apply({ status, page: 1 })}
			>
				{statusLabels[status]}
			</Button>
		{/each}
	</div>

	{#if orders.items.length === 0}
		<p class="text-sm text-muted-foreground">Aucune commande ne correspond.</p>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Référence</TableHead>
					<TableHead>Cliente</TableHead>
					<TableHead>Statut</TableHead>
					<TableHead>Paiement</TableHead>
					<TableHead class="text-right">Total</TableHead>
					<TableHead class="text-right">Date</TableHead>
					<TableHead></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each orders.items as order (order.reference)}
					<TableRow>
						<TableCell class="font-mono text-xs">{order.reference}</TableCell>
						<TableCell class="text-muted-foreground">{order.contactEmail}</TableCell>
						<TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
						<TableCell>
							<Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'outline'}>
								{order.paymentStatus}
							</Badge>
						</TableCell>
						<TableCell class="text-right tabular-nums">{formatPrice(order.totalCents)}</TableCell>
						<TableCell class="text-right text-muted-foreground">
							{dateFormatter.format(order.createdAt)}
						</TableCell>
						<TableCell class="text-right">
							<Button
								size="sm"
								variant="outline"
								href={resolve('/admin/commandes/[reference]', { reference: order.reference })}
							>
								Ouvrir
							</Button>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>

		{#if orders.pageCount > 1}
			<div class="flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={orders.page <= 1}
					onclick={() => apply({ page: orders.page - 1 })}
				>
					Précédent
				</Button>
				<span class="text-sm text-muted-foreground">
					Page {orders.page} / {orders.pageCount}
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={orders.page >= orders.pageCount}
					onclick={() => apply({ page: orders.page + 1 })}
				>
					Suivant
				</Button>
			</div>
		{/if}
	{/if}
</div>
