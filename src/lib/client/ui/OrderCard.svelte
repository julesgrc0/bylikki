<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice } from '#lib/client/utils/money';
	import { cancelMyOrder, type getMyOrders } from '#lib/remote/order.remote';
	import { resolve } from '$app/paths';

	type Order = Awaited<ReturnType<typeof getMyOrders>>[number];

	let { order }: { order: Order } = $props();

	const statusLabels: Record<Order['status'], string> = {
		PENDING: 'En attente de paiement',
		PAID: 'Paiement reçu',
		PREPARING: 'En préparation',
		SHIPPED: 'Expédiée',
		DELIVERED: 'Livrée',
		CANCELLED: 'Annulée',
		REFUNDED: 'Remboursée'
	};

	const statusColors: Record<Order['status'], string> = {
		PENDING: '#FFF4C2',
		PAID: '#DDF4E2',
		PREPARING: '#FFF4C2',
		SHIPPED: '#D8F0FB',
		DELIVERED: '#DDF4E2',
		CANCELLED: '#E9DFFF',
		REFUNDED: '#FFE9F2'
	};

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
	const cancellable = $derived(['PENDING', 'PAID', 'PREPARING'].includes(order.status));

	let pending = $state(false);
	let feedback = $state('');

	async function cancel() {
		pending = true;
		feedback = '';

		try {
			await cancelMyOrder(order.reference);
		} catch (error) {
			feedback = toMessage(error, "L'annulation a échoué.");
		} finally {
			pending = false;
		}
	}
</script>

<article
	class="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-paper p-5 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:flex-row lg:gap-[26px] lg:rounded-[26px] lg:px-7 lg:py-[26px] lg:shadow-[10px_12px_0_rgba(46,27,51,.08)]"
>
	<div class="flex min-w-0 flex-1 flex-col gap-2">
		<div class="flex flex-wrap items-center gap-3">
			<span
				class="rounded-[20px] border-[1.5px] border-ink px-3.5 py-[5px] text-[12.5px] font-semibold"
				style="background:{statusColors[order.status]}"
			>
				{statusLabels[order.status]}
			</span>
			<span class="text-[12.5px] text-ink/60">
				Commande {order.reference} · {dateFormatter.format(order.createdAt)}
			</span>
		</div>

		<ul class="m-0 flex list-none flex-col gap-1.5 p-0">
			{#each order.items as item (item.id)}
				<li class="text-[15px]">
					<span class="font-semibold">{item.productName}</span>
					<span class="text-ink/65">
						· {item.variantLabel} · ×{item.quantity} · {formatPrice(item.totalCents)}
					</span>
				</li>
			{/each}
		</ul>

		<span class="text-[13.5px] text-ink/60">
			Livraison : {order.shippingFullName}, {order.shippingPostalCode}
			{order.shippingCity}
			{#if order.trackingNumber}
				· suivi {order.trackingNumber}
			{/if}
		</span>

		{#if feedback}
			<span class="text-[13px] font-semibold text-pink-deep">{feedback}</span>
		{/if}
	</div>

	<div class="flex flex-row items-center justify-between gap-2.5 lg:flex-col lg:items-end">
		<span class="text-[22px] font-semibold">{formatPrice(order.totalCents)}</span>
		{#if order.invoiceNumber}
			<a
				href={resolve('/profile/commande/[reference]/facture', { reference: order.reference })}
				class="text-[13px] text-ink/75 underline"
			>
				Voir la facture
			</a>
		{/if}
		{#if cancellable}
			<button
				onclick={cancel}
				disabled={pending}
				class="cursor-pointer border-b-[1.5px] border-ink/40 pb-px text-[13px] text-ink/75 disabled:opacity-50"
			>
				{pending ? 'Annulation…' : 'Annuler la commande'}
			</button>
		{/if}
	</div>
</article>
