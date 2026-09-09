<script lang="ts">
	import { legalDocs, type LegalDoc } from '#lib/client/data/legal';

	let { active, onpick }: { active: LegalDoc; onpick: (id: string) => void } = $props();
</script>

<div class="flex flex-col gap-4 lg:sticky lg:top-[26px]">
	<span class="font-hand text-[24px] text-pink lg:text-[26px]">tout est écrit, promis ♡</span>
	<h1 class="m-0 text-[30px] leading-[1.08] font-semibold lg:text-[38px]">Informations légales</h1>

	<nav class="mt-2 flex flex-col gap-2">
		{#each legalDocs as doc (doc.id)}
			<button
				onclick={() => onpick(doc.id)}
				class="flex cursor-pointer items-center justify-between gap-2.5 rounded-[16px] border-[1.5px] border-ink/15 px-4 py-3 text-left text-[15px] font-semibold transition-colors {doc.id ===
				active.id
					? 'bg-ink text-cream'
					: 'bg-paper text-ink hover:bg-pink-pale'}"
				aria-current={doc.id === active.id ? 'page' : undefined}
			>
				<span>{doc.label}</span>
				<span class="opacity-50">→</span>
			</button>
		{/each}
	</nav>

	<p class="mt-2.5 mb-0 text-[13px] leading-[1.5] text-ink/60">
		Une question avant d’acheter ? Écris à
		<a href="mailto:bonjour@bylikki.fr">bonjour@bylikki.fr</a>, réponse sous 24 h.
	</p>
</div>
