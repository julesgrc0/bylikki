<script lang="ts">
	import AddressBook from '#lib/client/ui/AddressBook.svelte';
	import AvatarField from '#lib/client/ui/AvatarField.svelte';
	import ConsentToggle from '#lib/client/ui/ConsentToggle.svelte';
	import DangerZone from '#lib/client/ui/DangerZone.svelte';
	import EmptyState from '#lib/client/ui/EmptyState.svelte';
	import OrderCard from '#lib/client/ui/OrderCard.svelte';
	import SessionList from '#lib/client/ui/SessionList.svelte';
	import { constrainsOf } from '#lib/client/validation/constrains';
	import { profileSchema } from '#lib/client/validation/profile';
	import { signOut } from '#lib/remote/auth.remote';
	import { getMyOrders } from '#lib/remote/order.remote';
	import {
		exportMyData,
		getProfile,
		listMySessions,
		updateConsent,
		updateProfile
	} from '#lib/remote/user.remote';
	import { resolve } from '$app/paths';

	let { data } = $props();

	/** Les trois requetes partent ensemble plutot qu'en cascade. */
	const [profile, orders, sessions] = await Promise.all([
		getProfile(),
		getMyOrders(),
		listMySessions()
	]);
	const identityForm = updateProfile.preflight(profileSchema);

	const consentLabels = [
		{
			type: 'NEWSLETTER' as const,
			label: 'Nouveautés et collections',
			desc: 'Environ un e-mail par mois, jamais plus.'
		},
		{
			type: 'RESTOCK_ALERT' as const,
			label: 'Retour en stock',
			desc: 'Alerte quand une pièce épuisée revient.'
		},
		{
			type: 'REVIEW_REMINDER' as const,
			label: 'Demande d’avis',
			desc: 'Un seul rappel, 10 jours après la livraison.'
		}
	];

	let tab = $state<'achats' | 'params'>('achats');
	let exportNotice = $state('');

	async function download() {
		const payload = await exportMyData();
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = 'bylikki-mes-donnees.json';
		link.click();
		URL.revokeObjectURL(url);
		exportNotice = 'Archive téléchargée.';
	}
</script>

<svelte:head>
	<title>Mon espace — BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div
	class="flex flex-col gap-6 px-5 pt-8 pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8 lg:px-[70px] lg:pt-12"
>
	<div class="flex flex-col gap-2.5">
		<span class="font-hand text-[24px] text-pink lg:text-[27px]">re-bonjour ♡</span>
		<h1 class="m-0 text-[32px] leading-[1.04] font-semibold lg:text-[46px]">Mon espace</h1>
		<span class="text-[14.5px] text-ink/70">
			{profile.user.email} · compte créé le
			{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(profile.user.createdAt)}
		</span>
	</div>

	<div class="flex flex-wrap items-center gap-2.5 self-start">
		<div class="flex gap-2.5 rounded-[40px] border-2 border-ink bg-paper p-1.5">
			{#each [{ id: 'achats', label: 'Mes achats' }, { id: 'params', label: 'Paramètres' }] as const as entry (entry.id)}
				<button
					onclick={() => (tab = entry.id)}
					class="cursor-pointer rounded-[40px] px-5 py-3 text-[15px] font-semibold transition-colors lg:px-[26px] {tab ===
					entry.id
						? 'bg-pink text-white'
						: 'text-ink hover:bg-pink-pale'}"
					aria-current={tab === entry.id ? 'page' : undefined}
				>
					{entry.label}
				</button>
			{/each}
		</div>
		<button
			onclick={() => signOut()}
			class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-5 py-3 text-[14px] font-semibold"
		>
			Se déconnecter
		</button>
	</div>
</div>

{#if data.orderReference}
	<p
		class="mx-5 rounded-[20px] border-2 border-ink bg-green-soft px-5 py-4 text-[15px] lg:mx-[70px]"
	>
		Merci ♡ Ta commande <strong>{data.orderReference}</strong> est enregistrée. Tu la retrouves ci-dessous
		dès que le paiement est confirmé.
	</p>
{:else if data.paymentCancelled}
	<p
		class="mx-5 rounded-[20px] border-2 border-ink bg-yellow-soft px-5 py-4 text-[15px] lg:mx-[70px]"
	>
		Paiement interrompu — ton panier est toujours là.
	</p>
{/if}

{#if tab === 'achats'}
	<div class="flex flex-col gap-5 px-5 pt-4 pb-16 lg:gap-[26px] lg:px-[70px] lg:pb-20">
		{#if orders.length === 0}
			<EmptyState
				title="aucune commande pour l’instant ✦"
				description="Tes commandes et leur suivi s’afficheront ici."
			>
				<a
					href={resolve('/search')}
					class="rounded-[40px] bg-ink px-6 py-3.5 text-[15px] text-cream"
				>
					Découvrir la boutique →
				</a>
			</EmptyState>
		{:else}
			{#each orders as order (order.reference)}
				<OrderCard {order} />
			{/each}
		{/if}
	</div>
{:else}
	<div
		class="grid grid-cols-1 items-start gap-5 px-5 pt-4 pb-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-[26px] lg:px-[70px] lg:pb-20"
	>
		<div class="flex flex-col gap-5 lg:gap-[26px]">
			<section
				class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px]"
			>
				<h2 class="mt-0 mb-5 text-[22px] font-semibold lg:text-[24px]">Informations du compte</h2>

				<div class="mb-6">
					<AvatarField avatarUrl={profile.user.avatarUrl} displayName={profile.user.displayName} />
				</div>

				<form {...identityForm} class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<span class="text-[12.5px] font-semibold text-ink/70">Adresse e-mail</span>
						<div
							class="rounded-[16px] border-[1.5px] border-ink/20 bg-cream px-[18px] py-[15px] text-[15.5px]"
						>
							{profile.user.email}
						</div>
						<span class="text-[12px] text-ink/55">
							C’est ton identifiant de connexion : écris-moi pour le changer.
						</span>
					</div>

					<label class="flex flex-col gap-1.5 text-[12.5px] font-semibold text-ink/70">
						Nom affiché (facultatif)
						<input
							{...identityForm.fields.displayName.as('text')}
							{...constrainsOf(profileSchema, 'displayName')}
							value={identityForm.fields.displayName.value() ?? profile.user.displayName ?? ''}
							class="rounded-[16px] border-[1.5px] border-ink/20 bg-cream px-[18px] py-[15px] text-[15.5px] font-normal outline-none focus:border-pink"
						/>
					</label>

					<label class="flex flex-col gap-1.5 text-[12.5px] font-semibold text-ink/70">
						Téléphone (suivi de colis, facultatif)
						<input
							{...identityForm.fields.phone.as('tel')}
							{...constrainsOf(profileSchema, 'phone')}
							value={identityForm.fields.phone.value() ?? profile.user.phone ?? ''}
							class="rounded-[16px] border-[1.5px] border-ink/20 bg-cream px-[18px] py-[15px] text-[15.5px] font-normal outline-none focus:border-pink"
						/>
					</label>

					{#each identityForm.fields.allIssues() ?? [] as issue (issue.message)}
						<span class="text-[13px] font-semibold text-pink-deep">{issue.message}</span>
					{/each}

					<div class="flex items-center gap-3">
						<button
							type="submit"
							disabled={identityForm.pending > 0}
							class="cursor-pointer rounded-[40px] bg-ink px-6 py-3 text-[14.5px] font-semibold text-cream disabled:opacity-50"
						>
							{identityForm.pending > 0 ? 'Enregistrement…' : 'Enregistrer'}
						</button>
						{#if identityForm.result?.saved}
							<span class="text-[13.5px] text-ink/65">Modifications enregistrées.</span>
						{/if}
					</div>
				</form>
			</section>

			<AddressBook addresses={profile.addresses} />

			<section class="rounded-[20px] bg-blue-soft p-6 lg:rounded-[26px] lg:p-[30px]">
				<h2 class="mt-0 mb-1.5 text-[22px] font-semibold lg:text-[24px]">Communications</h2>
				<p class="mt-0 mb-[18px] text-[14px] text-ink/72">
					Consentements séparés, révocables en un clic. Rien n’est activé par défaut.
				</p>
				<div class="flex flex-col gap-3">
					{#each consentLabels as consent (consent.type)}
						{@const granted =
							profile.consents.find((entry) => entry.type === consent.type)?.granted ?? false}
						<ConsentToggle
							label={consent.label}
							desc={consent.desc}
							checked={granted}
							onchange={() => updateConsent({ type: consent.type, granted: !granted })}
						/>
					{/each}
				</div>
			</section>
		</div>

		<div class="flex flex-col gap-5 lg:gap-[26px]">
			<section
				class="rounded-[20px] border-2 border-ink bg-paper p-6 shadow-[8px_10px_0_rgba(46,27,51,.08)] lg:rounded-[26px] lg:p-[30px]"
			>
				<span class="text-[12px] font-semibold tracking-[0.16em] text-pink uppercase">RGPD</span>
				<h2 class="mt-2 mb-1.5 text-[22px] font-semibold lg:text-[24px]">Tes données</h2>
				<p class="mt-0 mb-5 text-[14px] leading-[1.55] text-ink/72">
					Adresse e-mail, adresses de livraison et historique de commandes. Conservés 3 ans après le
					dernier achat, 10 ans pour les factures.
				</p>
				<div class="flex flex-col gap-3">
					<div
						class="flex flex-col gap-3 rounded-[18px] border-[1.5px] border-ink/20 px-[18px] py-[15px] sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex min-w-0 flex-col gap-[3px]">
							<span class="text-[15px] font-semibold">Télécharger mes données</span>
							<span class="text-[12.5px] text-ink/60">Archive JSON, générée immédiatement.</span>
						</div>
						<button
							onclick={download}
							class="cursor-pointer self-start rounded-[40px] border-[1.5px] border-ink bg-yellow-soft px-[18px] py-2.5 text-[13px] font-semibold sm:self-auto"
						>
							Exporter
						</button>
					</div>
					{#if exportNotice}
						<span class="text-[13px] text-ink/65">{exportNotice}</span>
					{/if}
					<p class="m-0 text-[12.5px] leading-[1.5] text-ink/60">
						Rectification et opposition se font directement sur cette page. Pour toute autre demande
						: <a href="mailto:bonjour@bylikki.fr">bonjour@bylikki.fr</a>.
					</p>
				</div>
			</section>

			<SessionList {sessions} />

			<DangerZone requestedAt={profile.user.deletionRequestedAt} />
		</div>
	</div>
{/if}
