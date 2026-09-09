<script lang="ts">
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import { resolve } from '$app/paths';

	let { data } = $props();
</script>

<svelte:head>
	<title>Désinscription — BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto flex max-w-[560px] flex-col gap-5 px-5 py-16 text-center lg:py-24">
	{#if data.status === 'done'}
		<span class="font-hand text-[26px] text-pink">c'est noté ✦</span>
		<h1 class="m-0 text-[30px] font-semibold lg:text-[38px]">Tu ne recevras plus la lettre</h1>
		<p class="m-0 text-[15.5px] leading-[1.6] text-ink/75">
			Ta désinscription est prise en compte. Les e-mails liés à tes commandes, eux, continuent
			d'arriver : ils sont nécessaires au suivi de tes achats.
		</p>
	{:else}
		<h1 class="m-0 text-[30px] font-semibold lg:text-[38px]">Ce lien n'est plus valable</h1>
		<p class="m-0 text-[15.5px] leading-[1.6] text-ink/75">
			Tu peux gérer tes préférences directement depuis ton compte.
		</p>
	{/if}

	<div class="mt-2 flex justify-center">
		<ChunkyButton href={resolve('/profile')}>Mes préférences</ChunkyButton>
	</div>
</div>
