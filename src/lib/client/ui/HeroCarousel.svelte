<script lang="ts">
	import { slides } from '#lib/client/data/content';
	import type { ProductCardData } from '#lib/client/types';
	import { onMount } from 'svelte';
	import ChunkyButton from './ChunkyButton.svelte';
	import ProductCard from './ProductCard.svelte';
	import Star from './Star.svelte';

	let { products = [] }: { products?: ProductCardData[] } = $props();

	let index = $state(0);
	const slide = $derived(slides[index]);
	const featured = $derived(products[index % Math.max(products.length, 1)]);

	onMount(() => {
		const timer = setInterval(() => (index = (index + 1) % slides.length), 5200);
		return () => clearInterval(timer);
	});

	const geometry = [
		{ tf: 'translate(-50%,-50%) scale(1) rotate(-1.5deg)', op: 1, z: 6 },
		{ tf: 'translate(calc(-50% + 292px),-46%) scale(.78) rotate(6deg)', op: 0.95, z: 4 },
		{ tf: 'translate(-50%,-52%) scale(.6) rotate(0deg)', op: 0, z: 1 },
		{ tf: 'translate(calc(-50% - 292px),-46%) scale(.78) rotate(-6deg)', op: 0.95, z: 4 }
	];

	/** Le coverflow reprend la position relative de la carte par rapport au slide actif. */
	const geo = (i: number) =>
		geometry[(i - index + products.length * geometry.length) % geometry.length];
	const prev = () => (index = (index + slides.length - 1) % slides.length);
	const next = () => (index = (index + 1) % slides.length);
</script>

<section
	class="relative overflow-hidden px-5 pt-6 pb-6 lg:h-[820px] lg:px-0 lg:py-0"
	style="background:repeating-linear-gradient(90deg,#FFF0F6 0 14px,#FFF9F2 14px 28px)"
>
	<!-- ronds pastel -->
	<div
		class="pointer-events-none absolute -top-[90px] -left-[140px] hidden h-[440px] w-[440px] rounded-full bg-yellow-soft lg:block"
	></div>
	<div
		class="pointer-events-none absolute -right-[120px] -bottom-[170px] hidden h-[520px] w-[520px] rounded-full bg-purple-soft lg:block"
	></div>
	<div
		class="pointer-events-none absolute -top-[180px] left-[44%] hidden h-[300px] w-[300px] rounded-full bg-blue-soft opacity-70 lg:block"
	></div>

	<!-- étoiles décoratives -->
	<Star
		color="#FFDE59"
		size={74}
		class="absolute top-[70px] left-[520px] z-[2] hidden animate-twinkle lg:block"
	/>
	<Star
		color="#6EC6EE"
		size={56}
		class="absolute bottom-[96px] left-[60px] z-[2] hidden animate-twinkle lg:block"
	/>
	<Star
		color="#F0369B"
		size={44}
		class="absolute top-[120px] right-[56px] z-[8] hidden animate-twinkle lg:block"
	/>
	<Star
		color="#7ED598"
		size={34}
		class="absolute bottom-10 left-[47%] z-[8] hidden animate-twinkle lg:block"
	/>

	<!-- bloc texte -->
	<div
		class="relative z-[7] flex flex-col gap-3 lg:absolute lg:top-[104px] lg:left-[70px] lg:w-[452px] lg:gap-[18px]"
	>
		<span class="font-hand text-[21px] text-pink lg:text-[27px]">Bienvenue chez BYLIKKI ✦</span>
		<h1
			class="m-0 text-[34px] leading-[1.02] font-semibold tracking-[-0.01em] text-pretty lg:text-[58px] lg:leading-[1.06]"
		>
			Des créations faites pour te ressembler.
		</h1>

		<div class="mt-2 flex flex-col gap-[7px] lg:mt-3.5">
			<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">
				0{index + 1} / 0{slides.length} — {slide.kicker}
			</span>
			<h2 class="m-0 text-[22px] font-semibold lg:text-[29px]">{slide.title}</h2>
			<p class="m-0 max-w-[370px] text-[15px] leading-[1.55] text-ink/80 lg:text-[16px]">
				{slide.desc}
			</p>
		</div>

		<!-- carte produit mobile -->
		{#if featured}
			<div class="relative mx-auto my-4 h-[300px] w-[250px] lg:hidden">
				<ProductCard product={featured} compact />
			</div>
		{/if}

		<div class="flex flex-wrap items-center gap-4 lg:mt-1.5 lg:gap-[18px]">
			<ChunkyButton href={slide.href} class="w-full lg:w-auto">{slide.cta}</ChunkyButton>
			<span class="hidden font-hand text-[21px] text-ink/60 lg:inline">fait main à Nantes ♡</span>
		</div>

		<div class="mt-2 flex items-center justify-center gap-3.5 lg:mt-3.5 lg:justify-start">
			<button
				onclick={prev}
				aria-label="Création précédente"
				class="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-paper text-[18px]"
			>
				←
			</button>
			<button
				onclick={next}
				aria-label="Création suivante"
				class="flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-ink bg-ink text-[18px] text-cream"
			>
				→
			</button>
			<div class="ml-1.5 flex gap-[7px]">
				{#each slides as s, i (s.title)}
					<button
						onclick={() => (index = i)}
						aria-label={`Aller à ${s.title}`}
						class="h-[5px] cursor-pointer rounded-[5px] transition-all duration-500"
						style="width:{index === i ? 30 : 10}px;background:{index === i
							? '#F0369B'
							: 'rgba(46,27,51,.22)'}"
					></button>
				{/each}
			</div>
		</div>
	</div>

	<!-- coverflow desktop -->
	<div class="absolute top-0 -right-[60px] hidden h-[820px] w-[940px] lg:block">
		{#each products as product, i (product.slug)}
			<div
				class="absolute top-[48%] left-1/2 h-[520px] w-[396px] transition-[transform,opacity] duration-[800ms] [transition-timing-function:cubic-bezier(.4,0,.2,1)]"
				style="transform:{geo(i).tf};opacity:{geo(i).op};z-index:{geo(i).z}"
			>
				<ProductCard {product} />
			</div>
		{/each}
	</div>

	<!-- aiguille / étoile filante -->
	<div
		class="absolute bottom-[26px] left-[60px] z-[3] hidden h-[118px] w-[118px] animate-float lg:block"
	>
		<svg viewBox="0 0 200 200" class="h-full w-full overflow-visible" aria-hidden="true">
			<rect
				x="96"
				y="86"
				width="9"
				height="104"
				rx="4.5"
				transform="rotate(18 100 140)"
				fill="#FFDE59"
				stroke="#2E1B33"
				stroke-width="2.6"
			/>
			<path
				d="M100,10C107,58 128,79 176,86C128,93 107,114 100,162C93,114 72,93 24,86C72,79 93,58 100,10Z"
				fill="#F0369B"
				stroke="#2E1B33"
				stroke-width="3.4"
			/>
			<path
				d="M118,140C142,148 128,168 112,164C98,160 116,146 130,158C142,168 128,184 108,182"
				fill="none"
				stroke="#A98BF5"
				stroke-width="2.8"
				stroke-linecap="round"
			/>
		</svg>
	</div>

	<span
		class="absolute bottom-[44px] left-[70px] z-[7] hidden text-[12px] tracking-[0.14em] text-ink/45 uppercase lg:block"
	>
		Scrolle ↓
	</span>
</section>
