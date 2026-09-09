<script lang="ts">
	import { formatPrice } from '#lib/client/utils/money';
	import { resolve } from '$app/paths';

	let { data } = $props();

	const invoice = $derived(data.invoice);
</script>

<svelte:head>
	<title>Facture {invoice.number ?? invoice.reference} — BYLIKKI</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="mx-auto max-w-[820px] px-5 py-10 print:px-0 print:py-0">
	<div class="mb-6 flex flex-wrap items-center gap-3 print:hidden">
		<a
			href={resolve('/profile')}
			class="rounded-full border-2 border-ink px-4 py-2 text-[13px] font-semibold"
		>
			← Mes commandes
		</a>
		<button
			type="button"
			onclick={() => window.print()}
			class="rounded-full border-2 border-ink bg-pink px-4 py-2 text-[13px] font-semibold text-white"
		>
			Imprimer ou enregistrer en PDF
		</button>
	</div>

	<article
		class="rounded-[22px] border-2 border-ink bg-paper p-8 print:rounded-none print:border-0 print:p-0"
	>
		<header class="flex flex-wrap items-start justify-between gap-6 border-b-2 border-ink pb-6">
			<div>
				<p class="m-0 text-[22px] font-bold tracking-[0.22em] uppercase">{invoice.seller.name}</p>
				<p class="m-0 mt-1 text-[13px] leading-[1.6] text-ink/70">
					{invoice.seller.legalForm}<br />
					{#each invoice.seller.addressLines as line (line)}
						{line}<br />
					{/each}
					SIRET {invoice.seller.siret}<br />
					{invoice.seller.email}
				</p>
			</div>
			<div class="text-right">
				<p class="m-0 text-[12px] font-semibold tracking-[0.16em] text-pink-deep uppercase">
					Facture
				</p>
				<p class="m-0 mt-1 text-[19px] font-bold">{invoice.number ?? '—'}</p>
				<p class="m-0 mt-2 text-[13px] text-ink/70">
					Émise le {invoice.issuedOn}<br />
					Commande {invoice.reference}
				</p>
			</div>
		</header>

		<section class="border-b-2 border-ink py-6">
			<p class="m-0 text-[12px] font-semibold tracking-[0.16em] text-pink-deep uppercase">
				Facturé à
			</p>
			<p class="m-0 mt-2 text-[15px] leading-[1.6]">
				<strong>{invoice.buyer.fullName}</strong><br />
				{#each invoice.buyer.addressLines as line (line)}
					{line}<br />
				{/each}
				{invoice.buyer.email}
			</p>
		</section>

		<div class="overflow-x-auto py-6">
			<table class="w-full border-collapse text-[14px]">
				<thead>
					<tr class="border-b-2 border-ink text-left">
						<th class="py-2 pr-3 font-semibold">Désignation</th>
						<th class="px-3 py-2 text-right font-semibold">P.U.</th>
						<th class="px-3 py-2 text-right font-semibold">Qté</th>
						<th class="py-2 pl-3 text-right font-semibold">Total</th>
					</tr>
				</thead>
				<tbody>
					{#each invoice.lines as line (line.id)}
						<tr class="border-b border-ink/20">
							<td class="py-3 pr-3">{line.label}</td>
							<td class="px-3 py-3 text-right">{formatPrice(line.unitPriceCents)}</td>
							<td class="px-3 py-3 text-right">{line.quantity}</td>
							<td class="py-3 pl-3 text-right font-semibold">{formatPrice(line.totalCents)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<section class="flex justify-end border-t-2 border-ink pt-6">
			<dl class="m-0 w-full max-w-[280px] text-[14px]">
				<div class="flex justify-between py-1">
					<dt class="m-0">Sous-total</dt>
					<dd class="m-0">{formatPrice(invoice.subtotalCents)}</dd>
				</div>
				{#if invoice.discountCents > 0}
					<div class="flex justify-between py-1">
						<dt class="m-0">Remise{invoice.discountLabel ? ` — ${invoice.discountLabel}` : ''}</dt>
						<dd class="m-0">−{formatPrice(invoice.discountCents)}</dd>
					</div>
				{/if}
				<div class="flex justify-between py-1">
					<dt class="m-0">Livraison</dt>
					<dd class="m-0">
						{invoice.shippingCents === 0 ? 'Offerte' : formatPrice(invoice.shippingCents)}
					</dd>
				</div>
				<div class="mt-2 flex justify-between border-t-2 border-ink pt-2 text-[17px] font-bold">
					<dt class="m-0">Total réglé</dt>
					<dd class="m-0">{formatPrice(invoice.totalCents)}</dd>
				</div>
			</dl>
		</section>

		<footer class="mt-6 border-t border-ink/20 pt-4 text-[12.5px] leading-[1.6] text-ink/70">
			<p class="m-0">{invoice.seller.vatMention}</p>
			<p class="m-0">
				Facture acquittée. Conservation recommandée pendant toute la durée de la garantie légale.
			</p>
		</footer>
	</article>
</div>
