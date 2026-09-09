<script lang="ts">
	import { targetHref } from '#lib/client/utils/links';
	import type { SiteSettings } from '#lib/client/validation/settings';

	type Props = { announcement: SiteSettings['announcement'] };

	let { announcement }: Props = $props();

	const href = $derived(targetHref(announcement.target));

	const tones: Record<SiteSettings['announcement']['tone'], string> = {
		pink: 'bg-pink text-white',
		yellow: 'bg-yellow text-ink',
		blue: 'bg-blue text-ink',
		green: 'bg-green text-ink'
	};
</script>

{#if announcement.enabled && announcement.text}
	<div
		class="border-b-2 border-ink px-5 py-2 text-center text-[13.5px] font-semibold {tones[
			announcement.tone
		]}"
	>
		{#if href}
			<a {href} class="underline underline-offset-2">
				{announcement.text}
			</a>
		{:else}
			{announcement.text}
		{/if}
	</div>
{/if}
