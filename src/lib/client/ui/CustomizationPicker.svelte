<script lang="ts">
	import type { CustomizationOptionData, CustomizationSelection } from '#lib/client/types';
	import { formatPrice } from '#lib/client/utils/money';

	let {
		options,
		selection = $bindable()
	}: { options: CustomizationOptionData[]; selection: CustomizationSelection } = $props();

	function priceHint(delta: number) {
		return delta > 0 ? ` (+${formatPrice(delta)})` : '';
	}
</script>

{#if options.length > 0}
	<div class="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-purple-soft px-5 py-[18px]">
		<div>
			<div class="text-[18px]">Personnalise ta pièce</div>
			<div class="mt-0.5 text-[14px] text-ink/70">
				Chaque option est cousue ou enfilée à la main, rien n’est automatisé.
			</div>
		</div>

		{#each options as option (option.id)}
			<div class="flex flex-col gap-2">
				<label for={`option-${option.key}`} class="text-[13.5px] font-semibold">
					{option.label}{option.required ? ' *' : ''}{priceHint(option.priceDeltaCents)}
				</label>

				{#if option.kind === 'TEXT'}
					<input
						id={`option-${option.key}`}
						type="text"
						maxlength={option.maxLength ?? undefined}
						bind:value={selection[option.key]}
						placeholder={option.helpText ?? ''}
						class="rounded-[16px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] outline-none focus:border-pink"
					/>
				{:else}
					<div class="flex flex-wrap gap-2">
						{#each option.choices as choice (choice.id)}
							{@const active = selection[option.key] === choice.value}
							<button
								onclick={() => (selection[option.key] = active ? '' : choice.value)}
								aria-pressed={active}
								class="flex cursor-pointer items-center gap-2 rounded-[24px] border-[1.5px] border-ink px-4 py-2 text-[13.5px] {active
									? 'bg-ink text-cream'
									: 'bg-paper text-ink hover:bg-pink-pale'}"
							>
								{#if choice.hexColor}
									<span
										class="h-4 w-4 rounded-full border border-ink/40"
										style="background:{choice.hexColor}"
									></span>
								{/if}
								{choice.label}{priceHint(choice.priceDeltaCents)}
							</button>
						{/each}
					</div>
				{/if}

				{#if option.helpText && option.kind !== 'TEXT'}
					<span class="text-[12.5px] text-ink/60">{option.helpText}</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}
