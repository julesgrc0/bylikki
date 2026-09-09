<script lang="ts">
	import { cart, ui } from '#lib/client/state/shop.svelte';
	import ChunkyButton from '#lib/client/ui/ChunkyButton.svelte';
	import Star from '#lib/client/ui/Star.svelte';
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice } from '#lib/client/utils/money';
	import {
		componentKindLabels,
		MAX_BEADS,
		MIN_BEADS,
		type ComponentKind
	} from '#lib/client/validation/atelier';
	import { getComponents, priceMyDesign, storeDesign } from '#lib/remote/atelier.remote';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { resolve } from '$app/paths';

	const components = $derived(await getComponents());

	const beads = $derived(components.filter((component) => component.kind === 'BEAD'));
	const clasps = $derived(components.filter((component) => component.kind === 'CLASP'));
	const charms = $derived(components.filter((component) => component.kind === 'CHARM'));

	/** Chaque emplacement porte un identifiant propre : la meme perle peut servir plusieurs fois. */
	type Slot = { id: string; key: string };

	let slots = $state<Slot[]>([]);
	let claspKey = $state<string | null>(null);
	let selected = $state<number | null>(null);
	let feedback = $state('');
	let saving = $state(false);
	let shareToken = $state('');

	let nextId = 0;
	const makeSlot = (key: string) => ({ id: `slot-${nextId++}`, key });

	const keys = $derived(slots.map((slot) => slot.key));
	const priced = $derived(
		keys.length >= MIN_BEADS ? await priceMyDesign({ slots: keys, claspKey }) : null
	);

	const byKey = $derived(new Map(components.map((component) => [component.key, component])));
	const full = $derived(slots.length >= MAX_BEADS);

	function add(key: string) {
		if (full) {
			feedback = `Ce fil est complet : ${MAX_BEADS} éléments au maximum.`;
			return;
		}

		feedback = '';
		shareToken = '';
		slots = [...slots, makeSlot(key)];
		selected = slots.length - 1;
	}

	function removeAt(index: number) {
		slots = slots.filter((_, position) => position !== index);
		selected = slots.length === 0 ? null : Math.min(index, slots.length - 1);
		shareToken = '';
	}

	/** Deplacement au clavier : le glisser-deposer seul exclurait trop de monde. */
	function move(index: number, direction: -1 | 1) {
		const target = index + direction;

		if (target < 0 || target >= slots.length) {
			return;
		}

		const next = [...slots];
		[next[index], next[target]] = [next[target], next[index]];
		slots = next;
		selected = target;
		shareToken = '';
	}

	function onSlotKeydown(event: KeyboardEvent, index: number) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			removeAt(index);
			return;
		}

		if (event.key === 'ArrowLeft' && event.altKey) {
			event.preventDefault();
			move(index, -1);
			return;
		}

		if (event.key === 'ArrowRight' && event.altKey) {
			event.preventDefault();
			move(index, 1);
		}
	}

	function onDrop(event: CustomEvent<{ items: Slot[] }>) {
		slots = event.detail.items;
		shareToken = '';
	}

	async function save() {
		saving = true;
		feedback = '';

		try {
			const result = await storeDesign({ slots: keys, claspKey });

			if (result.status === 'invalid') {
				feedback = result.issues.map((issue) => issue.message).join(' ');
				return;
			}

			shareToken = result.design.shareToken;
			feedback = 'Création enregistrée. Le lien ci-dessous la retrouve à tout moment.';
		} catch (error) {
			feedback = toMessage(error, "Cette création n'a pas pu être enregistrée.");
		} finally {
			saving = false;
		}
	}

	async function addToCart() {
		saving = true;
		feedback = '';

		try {
			const result = await storeDesign({ slots: keys, claspKey });

			if (result.status === 'invalid') {
				feedback = result.issues.map((issue) => issue.message).join(' ');
				return;
			}

			cart.add({
				variantId: `design:${result.design.id}`,
				productSlug: 'atelier',
				productName: 'Création de l’atelier',
				variantLabel: `${slots.length} éléments · ${Math.round(result.design.lengthMm / 10)} cm`,
				unitPriceCents: result.design.priceCents,
				quantity: 1,
				customization: [],
				imageUrl: null
			});

			ui.openCart();
			feedback = '';
		} catch (error) {
			feedback = toMessage(error, "Cette création n'a pas pu être ajoutée au panier.");
		} finally {
			saving = false;
		}
	}

	const palettes = $derived(
		[
			{ kind: 'BEAD' as ComponentKind, items: beads },
			{ kind: 'CHARM' as ComponentKind, items: charms }
		].filter((palette) => palette.items.length > 0)
	);
</script>

<svelte:head>
	<title>L’atelier — compose ton bijou — BYLIKKI</title>
	<meta
		name="description"
		content="Choisis tes perles, assemble-les dans l’ordre que tu veux, et repars avec une pièce que personne d’autre n’a."
	/>
</svelte:head>

<div class="relative px-5 pt-8 pb-16 lg:px-[70px] lg:pt-12 lg:pb-20">
	<Star color="#FFDE59" size={120} class="absolute top-6 right-6 hidden animate-float lg:block" />

	<div class="mb-7 flex flex-col gap-2.5">
		<span class="font-hand text-[24px] text-pink lg:text-[27px]">à toi de jouer ✦</span>
		<h1 class="m-0 text-[32px] leading-[1.04] font-semibold lg:text-[46px]">L’atelier</h1>
		<p class="m-0 max-w-[56ch] text-[15.5px] leading-[1.6] text-ink/75">
			Clique sur une perle pour l’ajouter au fil, fais-la glisser pour la déplacer. Au clavier :
			<kbd class="rounded border border-ink/30 px-1.5 py-0.5 text-[12.5px]">Alt</kbd> +
			<kbd class="rounded border border-ink/30 px-1.5 py-0.5 text-[12.5px]">←</kbd>
			ou
			<kbd class="rounded border border-ink/30 px-1.5 py-0.5 text-[12.5px]">→</kbd>
			pour déplacer,
			<kbd class="rounded border border-ink/30 px-1.5 py-0.5 text-[12.5px]">Suppr</kbd> pour retirer.
		</p>
	</div>

	<div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-9">
		<div class="flex flex-col gap-5">
			<!-- le fil -->
			<section
				class="rounded-[24px] border-2 border-ink bg-paper p-5 shadow-[10px_12px_0_rgba(46,27,51,.1)] lg:p-7"
			>
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<h2 class="m-0 text-[18px] font-semibold">Ton fil</h2>
					<span class="text-[13px] text-ink/60">
						{slots.length} / {MAX_BEADS} éléments
					</span>
				</div>

				{#if slots.length === 0}
					<p
						class="m-0 rounded-[18px] border-[1.5px] border-dashed border-ink/30 px-5 py-8 text-center text-[14.5px] text-ink/60"
					>
						Choisis une première perle dans la palette.
					</p>
				{:else}
					<ul
						use:dragHandleZone={{ items: slots, flipDurationMs: 160, type: 'strand' }}
						onconsider={onDrop}
						onfinalize={onDrop}
						class="m-0 flex list-none flex-wrap gap-2.5 p-0"
					>
						{#each slots as slot, index (slot.id)}
							{@const component = byKey.get(slot.key)}
							<li animate:flip={{ duration: 160 }} class="relative">
								<button
									use:dragHandle
									aria-label="{component?.label ?? slot.key}, position {index +
										1} sur {slots.length}"
									aria-current={selected === index ? 'true' : undefined}
									onclick={() => (selected = selected === index ? null : index)}
									onkeydown={(event) => onSlotKeydown(event, index)}
									class="h-12 w-12 cursor-grab rounded-full border-2 transition-transform active:cursor-grabbing {selected ===
									index
										? 'scale-110 border-pink-deep'
										: 'border-ink'}"
									style="background:{component?.hexColor ?? '#FFF0F6'}"
								></button>

								{#if selected === index}
									<div
										class="absolute -top-2 -right-2 flex gap-0.5 rounded-full border-[1.5px] border-ink bg-paper px-1 py-0.5"
									>
										<button
											onclick={() => move(index, -1)}
											disabled={index === 0}
											aria-label="Déplacer vers la gauche"
											class="cursor-pointer px-1 text-[12px] disabled:opacity-30"
										>
											←
										</button>
										<button
											onclick={() => removeAt(index)}
											aria-label="Retirer cet élément"
											class="cursor-pointer px-1 text-[12px] text-pink-deep"
										>
											✕
										</button>
										<button
											onclick={() => move(index, 1)}
											disabled={index === slots.length - 1}
											aria-label="Déplacer vers la droite"
											class="cursor-pointer px-1 text-[12px] disabled:opacity-30"
										>
											→
										</button>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<!-- aperçu rendu par le serveur -->
			{#if priced}
				<section class="rounded-[24px] border-2 border-ink bg-cream p-5 lg:p-7">
					<h2 class="mt-0 mb-3 text-[18px] font-semibold">Aperçu</h2>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG construit par le serveur, sans donnee tierce -->
					<div class="w-full">{@html priced.previewSvg}</div>
				</section>
			{/if}

			<!-- palettes -->
			{#each palettes as palette (palette.kind)}
				<section class="rounded-[24px] border-2 border-ink bg-paper p-5 lg:p-7">
					<h2 class="mt-0 mb-3 text-[18px] font-semibold">{componentKindLabels[palette.kind]}</h2>
					<ul class="m-0 flex list-none flex-wrap gap-3 p-0">
						{#each palette.items as component (component.key)}
							<li class="flex flex-col items-center gap-1">
								<button
									onclick={() => add(component.key)}
									disabled={full || component.stock <= 0}
									aria-label="Ajouter {component.label}, {formatPrice(component.priceCents)}"
									title="{component.label} — {formatPrice(component.priceCents)}"
									class="h-11 w-11 cursor-pointer rounded-full border-2 border-ink transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-35"
									style="background:{component.hexColor}"
								></button>
								<span class="text-[11.5px] text-ink/60">{formatPrice(component.priceCents)}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/each}

			{#if clasps.length > 0}
				<section class="rounded-[24px] border-2 border-ink bg-paper p-5 lg:p-7">
					<h2 class="mt-0 mb-3 text-[18px] font-semibold">Fermoir</h2>
					<ul class="m-0 flex list-none flex-wrap gap-3 p-0">
						{#each clasps as clasp (clasp.key)}
							<li>
								<button
									onclick={() => (claspKey = claspKey === clasp.key ? null : clasp.key)}
									aria-pressed={claspKey === clasp.key}
									class="flex cursor-pointer items-center gap-2 rounded-[40px] border-2 px-4 py-2 text-[14px] {claspKey ===
									clasp.key
										? 'border-ink bg-pink-soft font-semibold'
										: 'border-ink/25'}"
								>
									<span
										class="h-4 w-4 rounded-full border-[1.5px] border-ink"
										style="background:{clasp.hexColor}"
									></span>
									{clasp.label}
									<span class="text-ink/60">{formatPrice(clasp.priceCents)}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<!-- récapitulatif -->
		<aside
			class="flex flex-col gap-4 rounded-[24px] border-2 border-ink bg-pink-pale p-6 lg:sticky lg:top-24"
		>
			<h2 class="m-0 text-[19px] font-semibold">Ta création</h2>

			{#if priced}
				<dl class="m-0 flex flex-col gap-1.5 text-[14.5px]">
					<div class="flex justify-between">
						<dt class="m-0 text-ink/70">Éléments</dt>
						<dd class="m-0">{slots.length}</dd>
					</div>
					<div class="flex justify-between">
						<dt class="m-0 text-ink/70">Longueur</dt>
						<dd class="m-0">≈ {Math.round(priced.lengthMm / 10)} cm</dd>
					</div>
					<div
						class="flex justify-between border-t-[1.5px] border-ink/15 pt-2 text-[19px] font-semibold"
					>
						<dt class="m-0">Prix</dt>
						<dd class="m-0">{formatPrice(priced.priceCents)}</dd>
					</div>
				</dl>

				{#each priced.issues as issue (issue.message)}
					<p class="m-0 text-[13.5px] font-semibold text-pink-deep">{issue.message}</p>
				{/each}

				<ChunkyButton full disabled={saving || priced.issues.length > 0} onclick={addToCart}>
					{saving ? 'Un instant…' : 'Ajouter au panier'}
				</ChunkyButton>

				<button
					onclick={save}
					disabled={saving || priced.issues.length > 0}
					class="cursor-pointer rounded-[40px] border-2 border-ink bg-paper px-5 py-3 text-[14.5px] font-semibold disabled:opacity-50"
				>
					Enregistrer et partager
				</button>
			{:else}
				<p class="m-0 text-[14.5px] leading-[1.55] text-ink/70">
					Ajoute au moins {MIN_BEADS} éléments pour voir le prix de ta création.
				</p>
			{/if}

			{#if shareToken}
				<p
					class="m-0 rounded-[16px] border-[1.5px] border-ink bg-paper px-4 py-3 text-[13px] break-all"
				>
					<a href={resolve('/atelier/[token]', { token: shareToken })} class="underline">
						Lien vers ta création
					</a>
				</p>
			{/if}

			{#if feedback}
				<p class="m-0 text-[13.5px] font-semibold text-pink-deep">{feedback}</p>
			{/if}
		</aside>
	</div>
</div>
