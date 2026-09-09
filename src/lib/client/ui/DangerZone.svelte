<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';
	import { cancelDeletion, requestDeletion } from '#lib/remote/user.remote';

	let { requestedAt = null }: { requestedAt?: Date | null } = $props();

	/** Zone rouge : demande de suppression de compte, en trois états. */
	let step = $state<'idle' | 'asking'>('idle');
	let word = $state('');
	let pending = $state(false);
	let error = $state('');

	const ready = $derived(word.trim().toUpperCase() === 'SUPPRIMER');

	async function confirm() {
		if (!ready) {
			return;
		}

		pending = true;
		error = '';

		try {
			await requestDeletion();
			step = 'idle';
			word = '';
		} catch (cause) {
			error = toMessage(cause, 'La demande a échoué.');
		} finally {
			pending = false;
		}
	}

	async function cancel() {
		pending = true;
		error = '';

		try {
			await cancelDeletion();
		} catch (cause) {
			error = toMessage(cause, "L'annulation a échoué.");
		} finally {
			pending = false;
		}
	}
</script>

<section
	class="rounded-[20px] border-2 border-pink-deep bg-pink-soft p-6 lg:rounded-[26px] lg:p-[30px]"
>
	<h2 class="m-0 mb-1.5 text-[20px] font-semibold text-pink-deep lg:text-[22px]">
		Supprimer mon compte
	</h2>
	<p class="mt-0 mb-[18px] text-[14px] leading-[1.55] text-ink/80">
		Suppression définitive du compte et des données associées sous 30 jours. Les factures sont
		conservées le temps légal, sans lien avec ton profil.
	</p>

	{#if error}
		<p class="mb-3 text-[13.5px] font-semibold text-pink-deep">{error}</p>
	{/if}

	{#if requestedAt}
		<div class="flex flex-col gap-2 rounded-[20px] border-[1.5px] border-pink-deep bg-paper p-5">
			<span class="text-[15px] font-semibold">Demande enregistrée</span>
			<span class="text-[13.5px] text-ink/70">
				Ton compte sera effacé sous 30 jours. Tu peux annuler tant que le délai court.
			</span>
			<button
				onclick={cancel}
				disabled={pending}
				class="cursor-pointer self-start text-[13.5px] font-semibold text-pink-deep disabled:opacity-50"
			>
				Annuler la demande
			</button>
		</div>
	{:else if step === 'idle'}
		<button
			onclick={() => (step = 'asking')}
			class="cursor-pointer rounded-[40px] border-2 border-pink-deep px-6 py-3.5 text-[14.5px] font-semibold text-pink-deep hover:bg-pink-deep/10"
		>
			Demander la suppression
		</button>
	{:else}
		<div class="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-pink-deep bg-paper p-5">
			<span class="text-[15px] font-semibold">Confirmer la suppression ?</span>
			<span class="text-[13.5px] text-ink/70">
				Tape SUPPRIMER pour valider. Tu seras déconnectée de tous tes appareils.
			</span>
			<input
				bind:value={word}
				placeholder="SUPPRIMER"
				aria-label="Confirmation de suppression"
				class="rounded-[14px] border-2 border-ink bg-cream px-4 py-3.5 text-[15px] text-ink outline-none focus:border-pink-deep"
			/>
			<div class="flex flex-col gap-2.5 sm:flex-row">
				<button
					onclick={confirm}
					disabled={!ready || pending}
					class="flex-1 cursor-pointer rounded-[40px] px-4 py-3.5 text-[14.5px] font-semibold text-white transition-colors disabled:cursor-not-allowed"
					style="background:{ready ? '#C41F77' : 'rgba(196,31,119,.35)'}"
				>
					{pending ? 'Envoi…' : 'Supprimer définitivement'}
				</button>
				<button
					onclick={() => {
						step = 'idle';
						word = '';
					}}
					class="cursor-pointer rounded-[40px] border-[1.5px] border-ink px-[22px] py-3.5 text-[14.5px] font-semibold"
				>
					Annuler
				</button>
			</div>
		</div>
	{/if}
</section>
