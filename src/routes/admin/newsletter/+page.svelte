<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '#lib/client/ui/shadcn/card';
	import { Input } from '#lib/client/ui/shadcn/input';
	import { Label } from '#lib/client/ui/shadcn/label';
	import { Textarea } from '#lib/client/ui/shadcn/textarea';
	import { toMessage } from '#lib/client/utils/errors';
	import { getIssues, removeIssue, saveIssue, sendIssue } from '#lib/remote/newsletter.remote';

	const issues = $derived(await getIssues());

	let subject = $state('');
	let body = $state('');
	let feedback = $state('');
	let pending = $state('');

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	async function run(key: string, action: () => Promise<unknown>, success: string) {
		pending = key;
		feedback = '';

		try {
			await action();
			feedback = success;
		} catch (error) {
			feedback = toMessage(error, "L'opération a échoué.");
		} finally {
			pending = '';
		}
	}
</script>

<svelte:head>
	<title>Newsletter — Administration BYLIKKI</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Newsletter</h1>
		<p class="text-sm text-muted-foreground">
			Envoyée uniquement aux comptes ayant accepté « Nouveautés et collections ». Chaque envoi porte
			un lien de désinscription en un clic.
		</p>
	</div>

	{#if feedback}
		<p class="text-sm font-medium">{feedback}</p>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Nouvelle lettre</CardTitle>
			<CardDescription>Un paragraphe par ligne. Aucune mise en forme à saisir.</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<Label for="subject">Objet</Label>
				<Input id="subject" maxlength={120} bind:value={subject} />
			</div>
			<div class="flex flex-col gap-1.5">
				<Label for="body">Contenu</Label>
				<Textarea id="body" rows={8} maxlength={8000} bind:value={body} />
			</div>
			<Button
				disabled={pending === 'save' || subject.trim().length < 3 || body.trim().length < 20}
				onclick={() =>
					run(
						'save',
						async () => {
							await saveIssue({ subject, body });
							subject = '';
							body = '';
						},
						'Brouillon enregistré.'
					)}
			>
				Enregistrer le brouillon
			</Button>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Lettres</CardTitle>
			<CardDescription>Un envoi est définitif : la lettre ne peut pas repartir.</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			{#if issues.length === 0}
				<p class="text-sm text-muted-foreground">Aucune lettre pour l'instant.</p>
			{/if}

			{#each issues as issue (issue.id)}
				<div class="flex flex-col gap-2 rounded-lg border p-4">
					<div class="flex flex-wrap items-center justify-between gap-2">
						<span class="font-medium">{issue.subject}</span>
						{#if issue.sentAt}
							<Badge>
								Envoyée le {dateFormatter.format(issue.sentAt)} · {issue.recipientCount} destinataires
							</Badge>
						{:else}
							<Badge variant="outline">Brouillon</Badge>
						{/if}
					</div>

					<p class="text-sm whitespace-pre-line text-muted-foreground">{issue.body}</p>

					{#if !issue.sentAt}
						<div class="flex gap-2">
							<Button
								size="sm"
								disabled={pending === issue.id}
								onclick={() =>
									run(issue.id, () => sendIssue(issue.id), 'Lettre envoyée aux abonnées.')}
							>
								Envoyer maintenant
							</Button>
							<Button
								size="sm"
								variant="ghost"
								disabled={pending === issue.id}
								onclick={() => run(issue.id, () => removeIssue(issue.id), 'Brouillon supprimé.')}
							>
								Supprimer
							</Button>
						</div>
					{/if}
				</div>
			{/each}
		</CardContent>
	</Card>
</div>
