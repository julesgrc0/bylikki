<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/plus';
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
	import { deleteProduct, getAdminProducts, publishProduct } from '#lib/remote/admin.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const statuses = ['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const;
	type Status = (typeof statuses)[number];

	const statusLabels: Record<Status, string> = {
		ALL: 'Tous',
		PUBLISHED: 'En ligne',
		DRAFT: 'Brouillons',
		ARCHIVED: 'Archivés'
	};

	const filters = $derived({
		query: page.url.searchParams.get('query') ?? '',
		status: (statuses.find((entry) => entry === page.url.searchParams.get('status')) ??
			'ALL') as Status,
		page: Number.parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1
	});

	const products = $derived(await getAdminProducts(filters));

	let pending = $state('');

	async function apply(patch: Partial<typeof filters>) {
		const next = { ...filters, ...patch };
		const queryString = buildQueryString([
			['query', next.query],
			['status', next.status === 'ALL' ? '' : next.status],
			['page', next.page > 1 ? String(next.page) : '']
		]);
		await goto(resolve(queryString ? `/admin/produits?${queryString}` : '/admin/produits'), {
			keepFocus: true,
			noScroll: true
		});
	}

	async function remove(productId: string, name: string) {
		if (!window.confirm(`Supprimer définitivement « ${name} » ? Les images seront effacées.`)) {
			return;
		}

		pending = productId;

		try {
			await deleteProduct(productId);
			await getAdminProducts(filters).refresh();
		} finally {
			pending = '';
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Produits</h1>
			<p class="text-sm text-muted-foreground">{products.total} produit(s) au catalogue</p>
		</div>
		<Button href={resolve('/admin/produits/[id]', { id: 'nouveau' })}>
			<PlusIcon class="size-4" />
			Nouveau produit
		</Button>
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Input
			class="max-w-xs"
			placeholder="Rechercher un produit…"
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

	{#if products.items.length === 0}
		<p class="text-sm text-muted-foreground">Aucun produit ne correspond.</p>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Produit</TableHead>
					<TableHead>État</TableHead>
					<TableHead class="text-right">Prix</TableHead>
					<TableHead class="text-right">Stock</TableHead>
					<TableHead class="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each products.items as product (product.id)}
					<TableRow>
						<TableCell>
							<div class="font-medium">{product.name}</div>
							<div class="text-xs text-muted-foreground">
								/{product.slug} · {product.variantCount} variante(s)
								{#if product.featured}
									· mis en avant
								{/if}
							</div>
						</TableCell>
						<TableCell>
							<Badge
								variant={product.status === 'PUBLISHED'
									? 'default'
									: product.status === 'DRAFT'
										? 'secondary'
										: 'outline'}
							>
								{product.status}
							</Badge>
						</TableCell>
						<TableCell class="text-right tabular-nums">
							{formatPrice(product.basePriceCents)}
						</TableCell>
						<TableCell class="text-right tabular-nums">{product.stock}</TableCell>
						<TableCell class="text-right">
							<div class="flex justify-end gap-2">
								<Button
									size="sm"
									variant="outline"
									href={resolve('/admin/produits/[id]', { id: product.id })}
								>
									Modifier
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onclick={async () => {
										await publishProduct({
											productId: product.id,
											status: product.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED'
										});
										await getAdminProducts(filters).refresh();
									}}
								>
									{product.status === 'PUBLISHED' ? 'Archiver' : 'Publier'}
								</Button>
								<Button
									size="sm"
									variant="destructive"
									disabled={pending === product.id}
									onclick={() => remove(product.id, product.name)}
								>
									Supprimer
								</Button>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>

		{#if products.pageCount > 1}
			<div class="flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={products.page <= 1}
					onclick={() => apply({ page: products.page - 1 })}
				>
					Précédent
				</Button>
				<span class="text-sm text-muted-foreground">
					Page {products.page} / {products.pageCount}
				</span>
				<Button
					variant="outline"
					size="sm"
					disabled={products.page >= products.pageCount}
					onclick={() => apply({ page: products.page + 1 })}
				>
					Suivant
				</Button>
			</div>
		{/if}
	{/if}
</div>
