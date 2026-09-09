<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';
	import { getMyRestockAlerts, unwatchVariant, watchVariant } from '#lib/remote/restock.remote';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	type Props = { variantId: string };

	let { variantId }: Props = $props();

	const signedIn = $derived(page.data.signedIn === true);

	let feedback = $state('');
	let pending = $state(false);

	async function toggle(watching: boolean) {
		pending = true;
		feedback = '';

		try {
			await (watching ? unwatchVariant(variantId) : watchVariant(variantId));
		} catch (error) {
			feedback = toMessage(error, "L'alerte n'a pas pu être enregistrée.");
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-2 rounded-[18px] border-2 border-ink bg-blue-soft px-5 py-4">
	<span class="text-[14.5px] font-semibold">Cette pièce est épuisée.</span>

	{#if !signedIn}
		<p class="m-0 text-[14px] leading-[1.55] text-ink/75">
			<a href={resolve('/sign')} class="font-semibold underline">Connecte-toi</a>
			pour être prévenue dès qu'elle revient.
		</p>
	{:else}
		{#await getMyRestockAlerts()}
			<span class="text-[14px] text-ink/60">…</span>
		{:then watched}
			{@const watching = watched.includes(variantId)}
			<p class="m-0 text-[14px] leading-[1.55] text-ink/75">
				{watching
					? 'Tu seras prévenue par e-mail dès son retour.'
					: 'On peut te prévenir dès qu’elle revient en boutique.'}
			</p>
			<button
				onclick={() => toggle(watching)}
				disabled={pending}
				class="cursor-pointer self-start rounded-[40px] border-2 border-ink bg-paper px-5 py-2.5 text-[14px] font-semibold disabled:opacity-50"
			>
				{#if pending}
					…
				{:else if watching}
					Ne plus me prévenir
				{:else}
					Préviens-moi du retour
				{/if}
			</button>
		{/await}
	{/if}

	{#if feedback}
		<span class="text-[13px] font-semibold text-pink-deep">{feedback}</span>
	{/if}
</div>
