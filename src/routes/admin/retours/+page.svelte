<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { Textarea } from '#lib/client/ui/shadcn/textarea';
	import { toMessage } from '#lib/client/utils/errors';
	import { formatPrice } from '#lib/client/utils/money';
	import { returnReasonLabels, returnStatusLabels } from '#lib/client/validation/returns';
	import { decideReturnRequest, getReturns } from '#lib/remote/admin.remote';

	const statuses = ['REQUESTED', 'ACCEPTED', 'RECEIVED', 'REFUNDED', 'REFUSED', 'ALL'] as const;

	let status = $state<(typeof statuses)[number]>('REQUESTED');
	const requests = $derived(await getReturns(status));

	let pending = $state('');
	let feedback = $state('');
	const notes = $state<Record<string, string>>({});

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' });

	async function decide(
		returnId: string,
		next: 'ACCEPTED' | 'REFUSED' | 'RECEIVED' | 'REFUNDED',
		success: string
	) {
		pending = returnId;
		feedback = '';

		try {
			await decideReturnRequest({ returnId, status: next, decisionNote: notes[returnId] ?? '' });
			await getReturns(status).refresh();
			feedback = success;
		} catch (error) {
			feedback = toMessage(error, "La décision n'a pas pu être enregistrée.");
		} finally {
			pending = '';
		}
	}
</script>

<svelte:head>
	<title>Retours — Administration BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Retours</h1>
		<p class="text-sm text-muted-foreground">
			Les CGV annoncent 14 jours après réception, étiquette prépayée en France, et remboursement
			sous 5 jours ouvrés après réception du colis.
		</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each statuses as entry (entry)}
			<Button
				size="sm"
				variant={status === entry ? 'default' : 'outline'}
				onclick={() => (status = entry)}
			>
				{entry === 'ALL' ? 'Tous' : returnStatusLabels[entry]}
			</Button>
		{/each}
	</div>

	{#if feedback}
		<p class="text-sm font-medium">{feedback}</p>
	{/if}

	{#if requests.length === 0}
		<p class="text-sm text-muted-foreground">Aucune demande dans cet état.</p>
	{:else}
		<ul class="m-0 flex list-none flex-col gap-4 p-0">
			{#each requests as request (request.id)}
				<li class="flex flex-col gap-3 rounded-lg border p-4">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<div>
							<span class="font-mono text-sm">{request.order.reference}</span>
							<span class="ml-2 text-sm text-muted-foreground">{request.order.contactEmail}</span>
						</div>
						<div class="flex items-center gap-2">
							<Badge variant="secondary">{returnReasonLabels[request.reason]}</Badge>
							<Badge>{returnStatusLabels[request.status]}</Badge>
						</div>
					</div>

					<ul class="m-0 flex list-none flex-col gap-1 p-0 text-sm">
						{#each request.items as item (item.orderItem.productName + item.orderItem.variantLabel)}
							<li>
								{item.orderItem.productName}
								<span class="text-muted-foreground">
									· {item.orderItem.variantLabel} · ×{item.quantity} ·
									{formatPrice(item.orderItem.totalCents)}
								</span>
							</li>
						{/each}
					</ul>

					{#if request.comment}
						<p class="m-0 rounded-md bg-muted/50 p-3 text-sm">« {request.comment} »</p>
					{/if}

					<p class="m-0 text-xs text-muted-foreground">
						Demandé le {dateFormatter.format(request.createdAt)}
						{#if request.decidedAt}
							· décidé le {dateFormatter.format(request.decidedAt)}
						{/if}
					</p>

					{#if request.status === 'REQUESTED' || request.status === 'ACCEPTED' || request.status === 'RECEIVED'}
						<div class="flex flex-col gap-2">
							<Label for="note-{request.id}" class="text-xs">
								Message à la cliente (joint aux e-mails d'acceptation et de refus)
							</Label>
							<Textarea
								id="note-{request.id}"
								rows={2}
								maxlength={600}
								value={notes[request.id] ?? request.decisionNote ?? ''}
								oninput={(event) => (notes[request.id] = event.currentTarget.value)}
							/>

							<div class="flex flex-wrap gap-2">
								{#if request.status === 'REQUESTED'}
									<Button
										size="sm"
										disabled={pending === request.id}
										onclick={() =>
											decide(request.id, 'ACCEPTED', 'Retour accepté, la cliente est prévenue.')}
									>
										Accepter
									</Button>
									<Button
										size="sm"
										variant="destructive"
										disabled={pending === request.id}
										onclick={() =>
											decide(request.id, 'REFUSED', 'Retour refusé, la cliente est prévenue.')}
									>
										Refuser
									</Button>
								{:else if request.status === 'ACCEPTED'}
									<Button
										size="sm"
										disabled={pending === request.id}
										onclick={() => decide(request.id, 'RECEIVED', 'Colis marqué comme reçu.')}
									>
										Colis reçu
									</Button>
								{:else}
									<Button
										size="sm"
										disabled={pending === request.id}
										onclick={() => decide(request.id, 'REFUNDED', 'Retour marqué comme remboursé.')}
									>
										Marquer remboursé
									</Button>
								{/if}
							</div>
						</div>
					{:else if request.decisionNote}
						<p class="m-0 text-sm text-muted-foreground">{request.decisionNote}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
