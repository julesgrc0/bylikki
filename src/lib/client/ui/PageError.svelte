<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';

	let { error, reset }: { error: unknown; reset: () => void } = $props();

	const message = $derived(toMessage(error, 'Le contenu n’a pas pu être chargé.'));
</script>

<div class="flex flex-col items-center gap-4 px-5 py-20 text-center lg:px-[70px]">
	<p class="m-0 font-hand text-[28px] lg:text-[32px]">oups, ça n’a pas chargé ✦</p>
	<p class="m-0 max-w-[52ch] text-[15px] leading-[1.6] text-ink/70">{message}</p>
	<button
		onclick={reset}
		class="cursor-pointer rounded-[40px] bg-ink px-6 py-3.5 text-[15px] font-semibold text-cream"
	>
		Réessayer
	</button>
</div>
