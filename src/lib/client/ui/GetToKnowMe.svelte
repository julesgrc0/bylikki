<script lang="ts">
	import PhotoPlaceholder from './PhotoPlaceholder.svelte';
	import Star from './Star.svelte';
	import TornEdge from './TornEdge.svelte';
</script>

<TornEdge variant="c" color="#FFD6E6" />
<section
	id="a-propos"
	class="relative px-5 pt-5 pb-10 lg:px-[70px] lg:pt-[26px] lg:pb-[90px]"
	style="background:repeating-linear-gradient(90deg,#FFD6E6 0 16px,#FFE9F2 16px 32px)"
>
	<h2 class="m-0 mb-2 text-center text-[30px] font-semibold lg:text-[52px]">Get to know me</h2>
	<p class="mx-auto mb-6 max-w-[480px] text-center text-[15px] text-ink/70 lg:mb-[34px]">
		La personne derrière BYLIKKI.
	</p>

	<div class="grid grid-cols-1 items-center gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-[34px]">
		<div
			class="relative rounded-[22px] border-2 border-ink bg-paper p-3 shadow-[8px_10px_0_rgba(240,54,155,.28)] lg:rounded-[30px] lg:px-[18px] lg:pt-[18px] lg:pb-2.5 lg:shadow-[14px_16px_0_rgba(240,54,155,.28)]"
		>
			<img
				src="/get-to-know-me.png"
				alt="Get to know me — Aulikki, fondatrice de BYLIKKI"
				class="block h-auto w-full"
			/>
			<Star
				color="#FFDE59"
				size={44}
				class="absolute -top-5 -right-[18px] hidden animate-twinkle lg:block"
			/>
		</div>

		<div class="flex flex-col gap-[18px]">
			<PhotoPlaceholder
				label="PHOTO — atelier"
				tint="rgba(169,139,245,.24)"
				bg="#FFFCF7"
				radius="20px"
				stripe={7}
				class="h-[160px] lg:h-[210px]"
				style="transform:rotate(-2.5deg)"
			/>
			<PhotoPlaceholder
				label="PHOTO — mains / détail"
				tint="rgba(110,198,238,.26)"
				bg="#FFFCF7"
				radius="20px"
				stripe={7}
				class="h-[160px] lg:h-[210px]"
				style="transform:rotate(3deg)"
			/>
			<p class="m-0 font-hand text-[22px] leading-[1.25] text-pink lg:text-[24px]">
				l’atelier, c’est ma table de salon ✦
			</p>
		</div>
	</div>

	<p
		class="mx-auto mt-8 max-w-[640px] text-center font-hand text-[24px] leading-[1.25] lg:mt-[44px] lg:text-[28px]"
	>
		J’ai toujours aimé créer des choses, toucher à différents supports comme la peinture, la
		broderie, les maquettes, la couture, la création de bijoux, etc…
	</p>
</section>
