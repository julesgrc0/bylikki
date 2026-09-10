<script lang="ts">
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import Star from '#lib/client/ui/Star.svelte';
	import { constrainsOf } from '#lib/client/validation/constrains';
	import { trackingSchema } from '#lib/client/validation/tracking';
	import { trackOrder } from '#lib/remote/tracking.remote';
	import { resolve } from '$app/paths';

	const form = trackOrder.preflight(trackingSchema);

	const order = $derived(form.result?.order ?? null);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

	const statusLabels: Record<string, string> = {
		PENDING: 'En attente de paiement',
		PAID: 'Paiement reçu',
		PREPARING: 'En préparation',
		SHIPPED: 'Expédiée',
		DELIVERED: 'Livrée',
		CANCELLED: 'Annulée',
		REFUNDED: 'Remboursée'
	};

	/** Les étapes franchies, dans l'ordre, telles que la base les a datées. */
	const steps = $derived(
		order
			? [
					{ label: 'Commande passée', at: order.createdAt },
					{ label: 'Paiement reçu', at: order.paidAt },
					{ label: 'Expédiée', at: order.shippedAt },
					{ label: 'Livrée', at: order.deliveredAt }
				].filter((step, index) => index === 0 || step.at !== null)
			: []
	);
</script>

<svelte:head>
	<title>Suivre ma commande — BYLIKKI</title>
	<meta
		name="description"
		content="Suis ta commande Bylikki avec sa référence et ton adresse e-mail, sans créer de compte."
	/>
</svelte:head>

<div class="relative mx-auto flex max-w-[720px] flex-col gap-7 px-5 py-12 lg:py-16">
	<Star color="#6EC6EE" size={110} class="absolute top-4 right-2 hidden animate-float lg:block" />

	<div class="flex flex-col gap-2.5">
		<span class="font-hand text-[24px] text-pink">où en est ton colis ✦</span>
		<h1 class="m-0 text-[32px] leading-[1.04] font-semibold lg:text-[42px]">Suivre ma commande</h1>
		<p class="m-0 max-w-[52ch] text-[15.5px] leading-[1.6] text-ink/75">
			Pas besoin de compte : la référence de ta commande et l'adresse e-mail utilisée suffisent.
		</p>
	</div>

	<form
		{...form}
		class="flex flex-col gap-4 rounded-[24px] border-2 border-ink bg-paper p-6 lg:p-8"
	>
		<div class="flex flex-col gap-2">
			<label for="reference" class="text-[13px] font-semibold">Référence de commande</label>
			<input
				id="reference"
				{...form.fields.reference.as('text')}
				{...constrainsOf(trackingSchema, 'reference')}
				placeholder="BY-26ABC123"
				autocomplete="off"
				class="rounded-[18px] border-2 border-ink bg-cream px-5 py-4 text-[16px] uppercase outline-none focus:border-pink"
			/>
			{#each form.fields.reference.issues() ?? [] as issue (issue.message)}
				<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
			{/each}
		</div>

		<div class="flex flex-col gap-2">
			<label for="tracking-email" class="text-[13px] font-semibold">Adresse e-mail</label>
			<input
				id="tracking-email"
				{...form.fields.email.as('email')}
				{...constrainsOf(trackingSchema, 'email')}
				autocomplete="email"
				placeholder="emma@exemple.fr"
				class="rounded-[18px] border-2 border-ink bg-cream px-5 py-4 text-[16px] outline-none focus:border-pink"
			/>
			{#each form.fields.email.issues() ?? [] as issue (issue.message)}
				<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
			{/each}
		</div>

		<ChunkyButton type="submit" full disabled={form.pending > 0}>
			{form.pending > 0 ? 'Recherche…' : 'Voir ma commande →'}
		</ChunkyButton>
	</form>

	{#if order}
		<section class="flex flex-col gap-5 rounded-[24px] border-2 border-ink bg-pink-pale p-6 lg:p-8">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<span class="font-mono text-[17px] font-semibold">{order.reference}</span>
				<span
					class="rounded-[40px] border-2 border-ink bg-paper px-4 py-1.5 text-[14px] font-semibold"
				>
					{statusLabels[order.status] ?? order.status}
				</span>
			</div>

			<ol class="m-0 flex list-none flex-col gap-2.5 p-0">
				{#each steps as step (step.label)}
					<li class="flex items-baseline gap-3 text-[14.5px]">
						<span class="text-pink">●</span>
						<span class="font-semibold">{step.label}</span>
						{#if step.at}
							<span class="text-ink/60">{dateFormatter.format(step.at)}</span>
						{/if}
					</li>
				{/each}
			</ol>

			{#if order.trackingNumber}
				<p class="m-0 rounded-[16px] border-2 border-ink bg-blue-soft px-5 py-3.5 text-[14.5px]">
					Numéro de suivi : <strong>{order.trackingNumber}</strong>
				</p>
			{/if}

			<ul
				class="m-0 flex list-none flex-col gap-1.5 border-t-[1.5px] border-ink/15 p-0 pt-4 text-[14.5px]"
			>
				{#each order.items as item (item.id)}
					<li>
						<span class="font-semibold">{item.productName}</span>
						<span class="text-ink/65">· {item.variantLabel} · ×{item.quantity}</span>
					</li>
				{/each}
			</ul>

			<p class="m-0 text-[13px] leading-[1.55] text-ink/60">
				Livraison vers {order.shippingCity}. Pour la facture et l'adresse complète,
				<a href={resolve('/sign')} class="underline">connecte-toi à ton compte</a>.
			</p>
		</section>
	{/if}
</div>
