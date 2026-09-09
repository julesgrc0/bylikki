<script lang="ts">
	import { infoLinks, shopLinks, socialLinks } from '#lib/client/data/content';
	import Logo from './Logo.svelte';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- tous les liens viennent de #lib/client/data/content, deja passes par resolve() -->
<footer class="bg-ink px-5 pt-10 pb-6 text-cream lg:px-[70px] lg:pt-[56px] lg:pb-10">
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-10">
		<div>
			<Logo size="md" tone="blush" />
			<p class="mt-4 mb-0 font-hand text-[21px] text-pink-blush lg:mt-[18px] lg:text-[24px]">
				Des créations faites pour te ressembler ✦
			</p>
		</div>

		<div>
			<div class="mb-3.5 text-[12px] tracking-[0.16em] text-cream/50 uppercase">Boutique</div>
			<nav class="flex flex-col gap-[9px] text-[15px]">
				{#each shopLinks as link (link.label)}
					<a href={link.href} class="text-cream hover:text-pink-blush">{link.label}</a>
				{/each}
			</nav>
		</div>

		<div>
			<div class="mb-3.5 text-[12px] tracking-[0.16em] text-cream/50 uppercase">Infos</div>
			<nav class="flex flex-col gap-[9px] text-[15px]">
				{#each infoLinks as link (link.label)}
					<a href={link.href} class="text-cream hover:text-pink-blush">{link.label}</a>
				{/each}
			</nav>
		</div>

		<div>
			<div class="mb-3.5 text-[12px] tracking-[0.16em] text-cream/50 uppercase">Suivre</div>
			<nav class="flex flex-col gap-[9px] text-[15px]">
				{#each socialLinks as link (link.label)}
					<a
						href={link.href}
						rel="noreferrer noopener"
						target="_blank"
						class="text-cream hover:text-pink-blush">{link.label}</a
					>
				{/each}
			</nav>
		</div>
	</div>

	<div
		class="mt-8 flex flex-col gap-2 border-t border-cream/15 pt-[18px] text-[12px] text-cream/45 lg:mt-[44px] lg:flex-row lg:justify-between"
	>
		<span>© 2026 BYLIKKI — toutes les pièces sont faites main</span>
		<span>Nantes, France</span>
	</div>
</footer>
