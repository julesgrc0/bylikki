<script lang="ts">
	import { toMessage } from '#lib/client/utils/errors';
	import {
		RETURN_WINDOW_DAYS,
		returnReasonLabels,
		returnReasons,
		type ReturnReason
	} from '#lib/client/validation/returns';
	import { getReturnableOrder, requestReturn } from '#lib/remote/returns.remote';

	type Props = { reference: string; onclose: () => void };

	let { reference, onclose }: Props = $props();

	const order = $derived(await getReturnableOrder(reference));

	let chosen = $state<string[]>([]);
	let reason = $state<ReturnReason>('CHANGE_OF_MIND');
	let comment = $state('');
	let pending = $state(false);
	let feedback = $state('');
	let done = $state(false);

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

	const personalisedChosen = $derived(
		order.items.filter((item) => chosen.includes(item.id) && item.personalised)
	);

	function toggle(id: string, checked: boolean) {
		chosen = checked ? [...new Set([...chosen, id])] : chosen.filter((entry) => entry !== id);
	}

	async function submit() {
		pending = true;
		feedback = '';

		try {
			await requestReturn({ reference, reason, comment, orderItemIds: chosen });
			done = true;
		} catch (error) {
			feedback = toMessage(error, "Cette demande n'a pas pu être envoyée.");
		} finally {
			pending = false;
		}
	}
</script>

<div class="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-paper p-5 lg:p-6">
	<div class="flex items-start justify-between gap-3">
		<h3 class="m-0 text-[18px] font-semibold">Demander un retour</h3>
		<button onclick={onclose} aria-label="Fermer" class="cursor-pointer text-[18px] text-ink/60">
			✕
		</button>
	</div>

	{#if done}
		<p class="m-0 rounded-[16px] bg-green-soft px-4 py-3 text-[14.5px]">
			Ta demande est enregistrée. Tu reçois un e-mail de confirmation, et on revient vers toi avec
			la marche à suivre.
		</p>
	{:else if order.status !== 'DELIVERED'}
		<p class="m-0 text-[14.5px] text-ink/75">Un retour se demande une fois la commande livrée.</p>
	{:else if order.hasOpenRequest}
		<p class="m-0 text-[14.5px] text-ink/75">Une demande est déjà en cours pour cette commande.</p>
	{:else if !order.withinWindow}
		<p class="m-0 text-[14.5px] text-ink/75">
			Le délai de {RETURN_WINDOW_DAYS} jours après réception est dépassé
			{#if order.deadline}
				(il courait jusqu'au {dateFormatter.format(order.deadline)}){/if}.
		</p>
	{:else}
		<fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
			<legend class="mb-1 p-0 text-[13px] font-semibold">Quelles pièces ?</legend>
			{#each order.items as item (item.id)}
				<label class="flex items-start gap-2.5 text-[14.5px]">
					<input
						type="checkbox"
						checked={chosen.includes(item.id)}
						onchange={(event) => toggle(item.id, event.currentTarget.checked)}
						class="mt-1"
					/>
					<span>
						{item.productName}
						<span class="text-ink/65">· {item.variantLabel} · ×{item.quantity}</span>
						{#if item.personalised}
							<span class="ml-1 rounded-[20px] bg-yellow-soft px-2 py-0.5 text-[11.5px]">
								personnalisée
							</span>
						{/if}
					</span>
				</label>
			{/each}
		</fieldset>

		<div class="flex flex-col gap-2">
			<label for="return-reason" class="text-[13px] font-semibold">Motif</label>
			<select
				id="return-reason"
				bind:value={reason}
				class="rounded-[14px] border-[1.5px] border-ink/25 bg-cream px-4 py-3 text-[15px]"
			>
				{#each returnReasons as entry (entry)}
					<option value={entry}>{returnReasonLabels[entry]}</option>
				{/each}
			</select>
		</div>

		{#if personalisedChosen.length > 0 && reason !== 'DEFECT'}
			<p class="m-0 rounded-[16px] bg-yellow-soft px-4 py-3 text-[13.5px]">
				Les pièces personnalisées ne se reprennent qu'en cas de défaut — c'est la contrepartie du
				sur-mesure. S'il y a un défaut, choisis ce motif et décris-le nous.
			</p>
		{/if}

		<div class="flex flex-col gap-2">
			<label for="return-comment" class="text-[13px] font-semibold">
				Un mot pour nous {reason === 'DEFECT' ? '(décris le défaut)' : '(facultatif)'}
			</label>
			<textarea
				id="return-comment"
				bind:value={comment}
				rows="3"
				maxlength="600"
				class="rounded-[14px] border-[1.5px] border-ink/25 bg-cream px-4 py-3 text-[15px]"
			></textarea>
		</div>

		{#if feedback}
			<span class="text-[13.5px] font-semibold text-pink-deep">{feedback}</span>
		{/if}

		<button
			onclick={submit}
			disabled={pending || chosen.length === 0}
			class="cursor-pointer self-start rounded-[40px] border-2 border-ink bg-pink px-6 py-3 text-[15px] font-semibold text-white disabled:opacity-50"
		>
			{pending ? 'Envoi…' : 'Envoyer ma demande'}
		</button>
	{/if}
</div>
