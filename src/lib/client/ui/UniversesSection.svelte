<script lang="ts">
	import { universeLinks } from '#lib/client/data/content';
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';

	const tags = ['Boucles', 'Colliers', 'Bijoux de téléphone'];
	const jewelleryHref = universeLinks[0].href;
	const sewingHref = universeLinks[1].href;

	const jewelleryPhotoLabel = 'PHOTO — boucles d’oreilles\nfond clair';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- liens deja resolus dans #lib/client/data/content -->
<section class="relative bg-cream px-5 py-12 lg:px-[70px] lg:pt-[74px] lg:pb-[90px]">
	<div class="mb-8 flex flex-col gap-3 lg:mb-[38px] lg:flex-row lg:items-end lg:justify-between">
		<h2 class="m-0 text-[28px] leading-[1.05] font-semibold lg:text-[46px]">
			Deux univers,<br />une seule paire de mains
		</h2>
		<span class="font-hand text-[20px] text-pink lg:rotate-[-3deg] lg:text-[23px]">
			tout est cousu / enfilé à la maison →
		</span>
	</div>

	<div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_1.25fr] lg:gap-[34px]">
		<!-- BIJOUX -->
		<div
			class="relative overflow-hidden rounded-[20px_20px_60px_20px] bg-yellow-soft p-4 lg:rounded-[26px_26px_90px_26px] lg:p-[26px]"
		>
			<PhotoPlaceholder
				label={jewelleryPhotoLabel}
				tint="rgba(240,54,155,.13)"
				bg="#FFFCF7"
				stripe={7}
				class="h-[190px] lg:h-[330px]"
			/>
			<div class="mt-3.5 flex items-center justify-between lg:mt-[22px]">
				<h3 class="m-0 text-[26px] font-semibold lg:text-[38px]">BIJOUX</h3>
				<a
					href={jewelleryHref}
					class="border-b-[1.5px] border-ink pb-0.5 text-[13px] text-ink lg:text-[14px]"
				>
					Voir tout
				</a>
			</div>
			<p class="mt-2.5 mb-0 text-[15px] leading-[1.5] text-ink/75">
				Boucles d’oreilles, colliers, bijoux de téléphone et pièces personnalisables.
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				{#each tags as tag (tag)}
					<span class="rounded-[20px] border-[1.5px] border-ink bg-paper px-3 py-[5px] text-[13px]">
						{tag}
					</span>
				{/each}
				<span
					class="rounded-[20px] border-[1.5px] border-ink bg-pink px-3 py-[5px] text-[13px] text-white"
				>
					Personnalisables
				</span>
			</div>
		</div>

		<!-- COUTURE -->
		<div class="flex flex-col gap-[22px]">
			<div
				class="relative rounded-[60px_20px_20px_20px] bg-blue-soft p-4 lg:rounded-[90px_26px_26px_26px] lg:p-[26px]"
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-[1.4fr_1fr]">
					<PhotoPlaceholder
						label="PHOTO — sac patchwork"
						tint="rgba(110,198,238,.28)"
						bg="#FFFCF7"
						stripe={7}
						class="h-[190px] lg:h-[250px]"
					/>
					<div class="flex flex-col gap-4">
						<PhotoPlaceholder
							label="PHOTO — trousse"
							tint="rgba(126,213,152,.3)"
							bg="#FFFCF7"
							stripe={7}
							class="h-[90px] flex-1 lg:h-auto"
						/>
						<PhotoPlaceholder
							label="PHOTO — pochette"
							tint="rgba(169,139,245,.3)"
							bg="#FFFCF7"
							stripe={7}
							class="h-[90px] flex-1 lg:h-auto"
						/>
					</div>
				</div>
				<div class="mt-3.5 flex items-center justify-between lg:mt-[22px]">
					<h3 class="m-0 text-[26px] font-semibold lg:text-[38px]">COUTURE</h3>
					<a
						href={sewingHref}
						class="border-b-[1.5px] border-ink pb-0.5 text-[13px] text-ink lg:text-[14px]"
					>
						Voir tout
					</a>
				</div>
				<p class="mt-2.5 mb-0 max-w-[520px] text-[15px] leading-[1.5] text-ink/75">
					Sacs, trousses, pochettes et pièces upcyclées — chaque tissu est chiné, donc chaque pièce
					est unique.
				</p>
			</div>

			<div class="flex items-center gap-4 pl-2">
				<svg viewBox="0 0 120 40" class="h-9 w-[110px]" aria-hidden="true">
					<path
						d="M4,30C34,6 70,34 112,12"
						fill="none"
						stroke="#F0369B"
						stroke-width="2.4"
						stroke-linecap="round"
					/>
					<path
						d="M112,12L98,10M112,12L104,24"
						fill="none"
						stroke="#F0369B"
						stroke-width="2.4"
						stroke-linecap="round"
					/>
				</svg>
				<span class="font-hand text-[22px]">pièces uniques, jamais rééditées</span>
			</div>
		</div>
	</div>

	<!-- sticker fait main -->
	<div
		class="absolute right-[52px] bottom-[26px] hidden h-[112px] w-[132px] rotate-[9deg] animate-float lg:block"
	>
		<svg viewBox="0 0 140 120" class="h-full w-full" aria-hidden="true">
			<path
				d="M22,58C14,30 46,12 74,16C104,20 128,36 126,64C124,92 96,106 66,102C36,98 28,84 22,58Z"
				fill="#FFFCF7"
				stroke="#2E1B33"
				stroke-width="2.6"
			/>
			<path
				d="M70,6C72,14 76,18 84,20C76,22 72,26 70,34C68,26 64,22 56,20C64,18 68,14 70,6Z"
				fill="#FFDE59"
				stroke="#2E1B33"
				stroke-width="2"
			/>
		</svg>
		<span
			class="absolute inset-0 flex items-center justify-center pt-4 text-center font-hand text-[24px] leading-none text-pink"
		>
			FAIT<br />MAIN ♡
		</span>
	</div>
</section>
