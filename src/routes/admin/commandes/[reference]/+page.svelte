<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Card, CardContent, CardHeader, CardTitle } from '#lib/client/ui/shadcn/card';
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
	import { formatPrice } from '#lib/client/utils/money';
	import { getAdminOrder, setOrderStatus } from '#lib/remote/admin.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const reference = $derived(page.params.reference ?? '');
	const order = $derived(await getAdminOrder(reference));

	const statuses = [
		'PENDING',
		'PAID',
		'PREPARING',
		'SHIPPED',
		'DELIVERED',
		'CANCELLED',
		'REFUNDED'
	] as const;

	let status = $state<(typeof statuses)[number]>('PENDING');
	let tracking = $state('');
	let initialised = $state('');
	let pending = $state(false);
	let feedback = $state('');

	/** On recharge le formulaire quand on ouvre une autre commande. */
	$effect(() => {
		if (initialised !== order.reference) {
			status = order.status;
			tracking = order.trackingNumber ?? '';
			initialised = order.reference;
		}
	});

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'long',
		timeStyle: 'short'
	});

	const timeline = $derived(
		[
			{ label: 'Créée', at: order.createdAt },
			{ label: 'Payée', at: order.paidAt },
			{ label: 'Expédiée', at: order.shippedAt },
			{ label: 'Livrée', at: order.deliveredAt },
			{ label: 'Annulée', at: order.cancelledAt },
			{ label: 'Remboursée', at: order.refundedAt }
		].filter((entry) => entry.at !== null)
	);

	async function save() {
		pending = true;
		feedback = '';

		try {
			await setOrderStatus({
				reference: order.reference,
				status,
				trackingNumber: tracking.trim() === '' ? null : tracking.trim()
			});
			feedback = 'Commande mise à jour.';
		} catch (error) {
			feedback = toMessage(error, 'La mise à jour a échoué.');
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h1 class="font-mono text-2xl font-semibold tracking-tight">{order.reference}</h1>
			<p class="text-sm text-muted-foreground">
				{order.contactEmail} · {dateFormatter.format(order.createdAt)}
				{#if order.invoiceNumber}
					· <a
						href={resolve('/profile/commande/[reference]/facture', { reference: order.reference })}
						class="underline">facture n° {order.invoiceNumber}</a
					>
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Badge variant="secondary">{order.status}</Badge>
			<Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'outline'}>
				{order.paymentStatus}
			</Badge>
			<Button variant="ghost" href={resolve('/admin/commandes')}>Retour</Button>
		</div>
	</div>

	{#if order.needsAttention}
		<Card class="border-destructive">
			<CardHeader><CardTitle>À traiter</CardTitle></CardHeader>
			<CardContent class="text-sm">
				{order.attentionReason ?? 'Cette commande demande une vérification.'}
			</CardContent>
		</Card>
	{/if}

	<div class="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
		<Card>
			<CardHeader><CardTitle>Articles</CardTitle></CardHeader>
			<CardContent class="flex flex-col gap-4">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Article</TableHead>
							<TableHead class="text-right">Qté</TableHead>
							<TableHead class="text-right">PU</TableHead>
							<TableHead class="text-right">Total</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each order.items as item (item.id)}
							<TableRow>
								<TableCell>
									<div class="font-medium">{item.productName}</div>
									<div class="text-xs text-muted-foreground">
										{item.variantLabel}
										{#if Array.isArray(item.customization)}
											{#each item.customization as option (JSON.stringify(option))}
												· {(option as { label: string; value: string }).label} :
												{(option as { label: string; value: string }).value}
											{/each}
										{/if}
									</div>
								</TableCell>
								<TableCell class="text-right tabular-nums">{item.quantity}</TableCell>
								<TableCell class="text-right tabular-nums">
									{formatPrice(item.unitPriceCents)}
								</TableCell>
								<TableCell class="text-right tabular-nums">
									{formatPrice(item.totalCents)}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>

				<div class="ml-auto flex w-56 flex-col gap-1 text-sm">
					<div class="flex justify-between">
						<span class="text-muted-foreground">Sous-total</span>
						<span class="tabular-nums">{formatPrice(order.subtotalCents)}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">Livraison</span>
						<span class="tabular-nums">{formatPrice(order.shippingCents)}</span>
					</div>
					<div class="flex justify-between font-medium">
						<span>Total</span>
						<span class="tabular-nums">{formatPrice(order.totalCents)}</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<div class="flex flex-col gap-4">
			<Card>
				<CardHeader><CardTitle>Livraison</CardTitle></CardHeader>
				<CardContent class="text-sm">
					<p class="m-0">{order.shippingFullName}</p>
					<p class="m-0">{order.shippingLine1}</p>
					{#if order.shippingLine2}
						<p class="m-0">{order.shippingLine2}</p>
					{/if}
					<p class="m-0">{order.shippingPostalCode} {order.shippingCity}</p>
					<p class="m-0">{order.shippingCountry}</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Suivi</CardTitle></CardHeader>
				<CardContent class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<Label for="order-status">Statut</Label>
						<select
							id="order-status"
							bind:value={status}
							class="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
						>
							{#each statuses as entry (entry)}
								<option value={entry}>{entry}</option>
							{/each}
						</select>
					</div>

					<div class="flex flex-col gap-2">
						<Label for="order-tracking">Numéro de suivi</Label>
						<Input id="order-tracking" bind:value={tracking} placeholder="6A 1234 5678 9" />
					</div>

					<Button onclick={save} disabled={pending}>
						{pending ? 'Enregistrement…' : 'Enregistrer'}
					</Button>
					{#if feedback}
						<span class="text-sm text-muted-foreground">{feedback}</span>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Historique</CardTitle></CardHeader>
				<CardContent class="flex flex-col gap-1 text-sm">
					{#each timeline as entry (entry.label)}
						<div class="flex justify-between">
							<span class="text-muted-foreground">{entry.label}</span>
							<span>{dateFormatter.format(entry.at!)}</span>
						</div>
					{/each}
					{#if order.stripePaymentIntentId}
						<div class="mt-2 font-mono text-xs break-all text-muted-foreground">
							{order.stripePaymentIntentId}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
</div>
