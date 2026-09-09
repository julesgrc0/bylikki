<script lang="ts">
	import { cart, ui } from '#lib/client/state/shop.svelte';
	import { formatPrice } from '#lib/client/utils/money';
	import { getCartDetails, startCheckout } from '#lib/remote/order.remote';
	import { getProfile } from '#lib/remote/user.remote';
	import { resolve } from '$app/paths';
	import ChunkyButton from './ChunkyButton.svelte';

	let { signedIn = false }: { signedIn?: boolean } = $props();

	let checkoutError = $state('');
	let pending = $state(false);

	/** Le serveur revalide prix, stock et personnalisations a chaque ouverture. */
	const details = $derived(cart.lines.length > 0 ? getCartDetails(cart.toPayload()) : null);
	const profile = $derived(signedIn && ui.cartOpen ? getProfile() : null);

	async function checkout() {
		const addresses = profile?.current?.addresses ?? [];
		const address = addresses.find((candidate) => candidate.isDefault) ?? addresses[0];

		if (!address) {
			checkoutError = 'Ajoute une adresse de livraison dans ton profil avant de commander.';
			return;
		}

		checkoutError = '';
		pending = true;

		try {
			const result = await startCheckout({ addressId: address.id, lines: cart.toPayload() });

			if (result.status === 'invalid') {
				checkoutError = result.issues.map((issue) => issue.message).join(' ');
				return;
			}

			window.location.href = result.url;
		} catch (error) {
			checkoutError =
				error instanceof Error ? error.message : "La commande n'a pas pu etre lancee.";
		} finally {
			pending = false;
		}
	}
</script>

<button
	aria-label="Fermer le panier"
	onclick={() => ui.closeAll()}
	class="fixed inset-0 z-[62] cursor-default bg-ink/35 transition-opacity duration-300 {ui.cartOpen
		? 'opacity-100'
		: 'pointer-events-none opacity-0'}"
></button>

<aside
	class="fixed top-0 right-0 z-[63] flex h-full w-full flex-col bg-paper shadow-[-22px_0_60px_rgba(46,27,51,.2)] transition-transform duration-[450ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)] sm:w-[430px] {ui.cartOpen
		? 'translate-x-0'
		: 'translate-x-full'}"
	aria-hidden={!ui.cartOpen}
>
	<div
		class="flex items-center justify-between border-b-[1.5px] border-ink/12 px-7 pt-[26px] pb-[18px]"
	>
		<span class="text-[24px] font-semibold">Ton panier ({cart.count})</span>
		<button onclick={() => ui.closeAll()} class="cursor-pointer text-[22px]" aria-label="Fermer"
			>✕</button
		>
	</div>

	<div class="flex flex-1 flex-col gap-5 overflow-auto px-7 py-[22px]">
		{#each cart.lines as line (cart.keyOf(line))}
			{@const key = cart.keyOf(line)}
			<div class="flex gap-4">
				{#if line.imageUrl}
					<img
						src={line.imageUrl}
						alt=""
						class="h-[100px] w-[88px] flex-none rounded-[14px] border-[1.5px] border-ink/20 object-cover"
					/>
				{:else}
					<div
						class="h-[100px] w-[88px] flex-none rounded-[14px] border-[1.5px] border-ink/20"
						style="background:repeating-linear-gradient(135deg,rgba(240,54,155,.16) 0 6px,rgba(255,255,255,0) 6px 12px),#FFF9F2"
					></div>
				{/if}
				<div class="flex flex-1 flex-col gap-1.5">
					<a href={resolve('/[slug]', { slug: line.productSlug })} class="text-[17px] text-ink">
						{line.productName}
					</a>
					<div class="text-[13px] text-ink/60">{line.variantLabel}</div>
					{#each line.customization as option (option.key)}
						<div class="text-[12.5px] text-ink/55">{option.label} : {option.value}</div>
					{/each}
					<div class="mt-1.5 flex items-center justify-between">
						<div
							class="flex items-center gap-3 rounded-[20px] border-[1.5px] border-ink/25 px-3 py-1 text-[14px]"
						>
							<button
								onclick={() => cart.setQuantity(key, line.quantity - 1)}
								class="flex cursor-pointer items-center"
								aria-label="Retirer un exemplaire"
							>
								{#if line.quantity <= 1}
									<svg viewBox="0 0 24 24" class="h-[15px] w-[15px]" aria-hidden="true">
										<path
											d="M5,7h14M9,7V4.5h6V7M6.5,7l1,13h9l1,-13"
											fill="none"
											stroke="#F0369B"
											stroke-width="1.8"
											stroke-linecap="round"
										/>
									</svg>
								{:else}
									−
								{/if}
							</button>
							<span>{line.quantity}</span>
							<button
								onclick={() => cart.setQuantity(key, line.quantity + 1)}
								class="cursor-pointer"
								aria-label="Ajouter un exemplaire"
							>
								+
							</button>
						</div>
						<span class="text-[16px]">{formatPrice(line.unitPriceCents * line.quantity)}</span>
					</div>
				</div>
			</div>
		{/each}

		{#if cart.lines.length === 0}
			<p class="mt-10 text-center font-hand text-[24px] text-ink/55">
				ton panier est encore vide ✦
			</p>
		{/if}

		{#if details}
			{#await details then cartDetails}
				{#each cartDetails.issues as issue (issue.variantId + issue.message)}
					<p
						class="rounded-[16px] border-[1.5px] border-pink-deep bg-pink-soft px-4 py-3 text-[13.5px] text-pink-deep"
					>
						{issue.message}
					</p>
				{/each}
			{/await}
		{/if}
	</div>

	<div class="border-t-[1.5px] border-ink/12 bg-pink-pale px-7 pt-[22px] pb-7">
		{#if details}
			{#await details}
				<div class="mb-4 h-[52px] animate-pulse rounded-[16px] bg-ink/5"></div>
			{:then cartDetails}
				<div class="mb-1.5 flex justify-between text-[15px]">
					<span>Sous-total</span><span>{formatPrice(cartDetails.subtotalCents)}</span>
				</div>
				<div class="mb-1.5 flex justify-between text-[15px]">
					<span>Livraison</span>
					<span>
						{cartDetails.shippingCents === 0 ? 'Offerte' : formatPrice(cartDetails.shippingCents)}
					</span>
				</div>
				<div class="mb-4 flex justify-between text-[20px]">
					<span>Total</span><span>{formatPrice(cartDetails.totalCents)}</span>
				</div>
			{/await}
		{:else}
			<div class="mb-4 flex justify-between text-[20px]">
				<span>Total</span><span>{formatPrice(0)}</span>
			</div>
		{/if}

		{#if checkoutError}
			<p class="mb-3 text-[13.5px] font-semibold text-pink-deep">{checkoutError}</p>
		{/if}

		{#if signedIn}
			<ChunkyButton
				full
				class="shadow-[0_7px_0_var(--color-pink-deep)]"
				onclick={checkout}
				disabled={pending || cart.lines.length === 0}
			>
				{pending ? 'Redirection…' : 'Passer commande'}
			</ChunkyButton>
		{:else}
			<ChunkyButton full href={resolve('/sign')} class="shadow-[0_7px_0_var(--color-pink-deep)]">
				Se connecter pour commander
			</ChunkyButton>
		{/if}

		<p class="mt-3 text-center font-hand text-[19px] text-ink/60">
			emballé à la main, avec un petit mot ♡
		</p>
	</div>
</aside>
