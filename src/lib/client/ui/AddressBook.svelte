<script lang="ts">
	import { constrainsOf } from '#lib/client/validation/constrains';
	import { addressSchema } from '#lib/client/validation/profile';
	import { deleteAddress, upsertAddress, type getProfile } from '#lib/remote/user.remote';
	import ChunkyButton from './ChunkyButton.svelte';

	type Address = Awaited<ReturnType<typeof getProfile>>['addresses'][number];

	let { addresses }: { addresses: Address[] } = $props();

	let editing = $state<string | null>(null);
	let open = $state(false);

	const current = $derived(addresses.find((address) => address.id === editing) ?? null);
	const form = $derived(upsertAddress.preflight(addressSchema));

	function edit(address: Address | null) {
		editing = address?.id ?? null;
		open = true;
	}

	const countries = [
		{ value: 'FR', label: 'France' },
		{ value: 'BE', label: 'Belgique' },
		{ value: 'CH', label: 'Suisse' },
		{ value: 'LU', label: 'Luxembourg' }
	];
</script>

<section
	class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px]"
>
	<div class="mb-5 flex items-center justify-between gap-4">
		<h2 class="m-0 text-[22px] font-semibold lg:text-[24px]">Adresses de livraison</h2>
		<button onclick={() => edit(null)} class="cursor-pointer text-[13.5px] font-semibold text-pink">
			Ajouter
		</button>
	</div>

	<div class="flex flex-col gap-3">
		{#each addresses as address (address.id)}
			<div
				class="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-ink/20 px-[18px] py-[15px] sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex min-w-0 flex-col gap-[3px]">
					<span class="text-[15px] font-semibold">
						{address.fullName}
						{#if address.isDefault}
							<span class="ml-2 rounded-[20px] bg-green-soft px-2.5 py-[2px] text-[11.5px]">
								Par défaut
							</span>
						{/if}
					</span>
					<span class="text-[13px] text-ink/65">
						{address.line1}{address.line2 ? `, ${address.line2}` : ''} · {address.postalCode}
						{address.city} · {address.country}
					</span>
				</div>
				<div class="flex gap-3">
					<button
						onclick={() => edit(address)}
						class="cursor-pointer text-[13px] font-semibold text-pink"
					>
						Modifier
					</button>
					<button
						onclick={() => deleteAddress(address.id)}
						class="cursor-pointer text-[13px] text-ink/60"
					>
						Supprimer
					</button>
				</div>
			</div>
		{/each}

		{#if addresses.length === 0}
			<p class="m-0 text-[14px] text-ink/65">
				Aucune adresse enregistrée. Elle n’est demandée qu’au moment d’une livraison.
			</p>
		{/if}
	</div>

	{#if open}
		<form
			{...form.enhance(async (instance) => {
				await instance.submit();

				if (instance.result?.saved) {
					open = false;
					editing = null;
				}
			})}
			class="mt-5 flex flex-col gap-3.5 rounded-[18px] border-[1.5px] border-ink/25 bg-cream p-5"
		>
			<input {...form.fields.addressId.as('hidden', current?.id ?? '')} />

			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
					Nom du destinataire
					<input
						{...form.fields.fullName.as('text')}
						{...constrainsOf(addressSchema, 'fullName')}
						value={form.fields.fullName.value() ?? current?.fullName ?? ''}
						class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
					/>
				</label>
				<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
					Libellé (facultatif)
					<input
						{...form.fields.label.as('text')}
						{...constrainsOf(addressSchema, 'label')}
						value={form.fields.label.value() ?? current?.label ?? ''}
						placeholder="Maison, bureau…"
						class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
					/>
				</label>
			</div>

			<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
				Adresse
				<input
					{...form.fields.line1.as('text')}
					{...constrainsOf(addressSchema, 'line1')}
					value={form.fields.line1.value() ?? current?.line1 ?? ''}
					class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
				/>
			</label>

			<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
				Complément (facultatif)
				<input
					{...form.fields.line2.as('text')}
					{...constrainsOf(addressSchema, 'line2')}
					value={form.fields.line2.value() ?? current?.line2 ?? ''}
					class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
				/>
			</label>

			<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-[140px_1fr_160px]">
				<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
					Code postal
					<input
						{...form.fields.postalCode.as('text')}
						{...constrainsOf(addressSchema, 'postalCode')}
						value={form.fields.postalCode.value() ?? current?.postalCode ?? ''}
						class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
					/>
				</label>
				<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
					Ville
					<input
						{...form.fields.city.as('text')}
						{...constrainsOf(addressSchema, 'city')}
						value={form.fields.city.value() ?? current?.city ?? ''}
						class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
					/>
				</label>
				<label class="flex flex-col gap-1.5 text-[13px] font-semibold">
					Pays
					<select
						{...form.fields.country.as('select')}
						class="rounded-[14px] border-[1.5px] border-ink/25 bg-paper px-4 py-3 text-[15px] font-normal outline-none focus:border-pink"
					>
						{#each countries as country (country.value)}
							<option value={country.value}>{country.label}</option>
						{/each}
					</select>
				</label>
			</div>

			<label class="flex cursor-pointer items-center gap-3 text-[14px]">
				<input {...form.fields.isDefault.as('checkbox')} class="h-5 w-5 accent-pink" />
				Utiliser cette adresse par défaut
			</label>

			{#each form.fields.allIssues() ?? [] as issue (issue.message)}
				<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
			{/each}

			<div class="flex flex-col gap-2.5 sm:flex-row">
				<ChunkyButton type="submit" disabled={form.pending > 0}>
					{form.pending > 0 ? 'Enregistrement…' : 'Enregistrer'}
				</ChunkyButton>
				<button
					type="button"
					onclick={() => {
						open = false;
						editing = null;
					}}
					class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-[22px] py-3.5 text-[14.5px] font-semibold"
				>
					Annuler
				</button>
			</div>
		</form>
	{/if}
</section>
