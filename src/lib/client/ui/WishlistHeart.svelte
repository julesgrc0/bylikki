<script lang="ts">
	import { wishlist } from '#lib/client/state/shop.svelte';
	import { toMessage } from '#lib/client/utils/errors';
	import { toggleWishlist } from '#lib/remote/wishlist.remote';
	import { page } from '$app/state';

	type Props = { productId: string; productName: string; class?: string };

	let { productId, productName, class: className = '' }: Props = $props();

	/** L'etat de connexion vient de la mise en page : inutile de le faire descendre. */
	const signedIn = $derived(page.data.signedIn === true);

	const saved = $derived(wishlist.has(productId));

	let pending = $state(false);
	let hint = $state('');

	async function toggle(event: MouseEvent) {
		/** Le coeur vit souvent dans une carte cliquable : il ne doit pas naviguer. */
		event.preventDefault();
		event.stopPropagation();

		if (!signedIn) {
			wishlist.toggleLocal(productId);
			hint = wishlist.has(productId)
				? 'Gardé de côté. Connecte-toi pour le retrouver partout.'
				: '';
			return;
		}

		pending = true;

		try {
			await toggleWishlist(productId);
			wishlist.toggleLocal(productId);
			hint = '';
		} catch (error) {
			hint = toMessage(error, "Cette pièce n'a pas pu être mise de côté.");
		} finally {
			pending = false;
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	disabled={pending}
	aria-pressed={saved}
	aria-label={saved
		? `Retirer ${productName} de mes envies`
		: `Ajouter ${productName} à mes envies`}
	title={saved ? 'Retirer de mes envies' : 'Ajouter à mes envies'}
	class="cursor-pointer text-[19px] leading-none transition-transform hover:scale-110 disabled:opacity-50 {className}"
	class:text-pink={saved}
	class:text-ink={!saved}
>
	{saved ? '♥' : '♡'}
</button>

{#if hint}
	<span class="text-[12px] text-ink/60">{hint}</span>
{/if}
