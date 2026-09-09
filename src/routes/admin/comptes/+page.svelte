<script lang="ts">
	import { Badge } from '#lib/client/ui/shadcn/badge';
	import { Button } from '#lib/client/ui/shadcn/button';
	import { Input } from '#lib/client/ui/shadcn/input';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/client/ui/shadcn/table';
	import { toMessage } from '#lib/client/utils/errors';
	import { buildQueryString } from '#lib/client/utils/search-params';
	import { changeUserRole, deleteUserAccount, getAdminUsers } from '#lib/remote/admin.remote';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const filters = $derived({
		query: page.url.searchParams.get('query') ?? '',
		page: Number.parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1
	});

	const users = $derived(await getAdminUsers(filters));

	const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

	let pending = $state('');
	let feedback = $state('');

	async function apply(patch: Partial<typeof filters>) {
		const next = { ...filters, ...patch };
		const queryString = buildQueryString([
			['query', next.query],
			['page', next.page > 1 ? String(next.page) : '']
		]);
		await goto(resolve(queryString ? `/admin/comptes?${queryString}` : '/admin/comptes'), {
			keepFocus: true,
			noScroll: true
		});
	}

	async function run(userId: string, action: () => Promise<unknown>) {
		pending = userId;
		feedback = '';

		try {
			await action();
			await getAdminUsers(filters).refresh();
		} catch (error) {
			feedback = toMessage(error, "L'action a échoué.");
		} finally {
			pending = '';
		}
	}
</script>

<div class="flex flex-col gap-6">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Comptes</h1>
		<p class="text-sm text-muted-foreground">
			{users.total} compte(s). Seuls l’e-mail et ce que la personne a renseigné sont stockés.
		</p>
	</div>

	<Input
		class="max-w-xs"
		placeholder="Rechercher un e-mail…"
		value={filters.query}
		onchange={(event) => apply({ query: event.currentTarget.value, page: 1 })}
	/>

	{#if feedback}
		<p class="text-sm font-medium text-destructive">{feedback}</p>
	{/if}

	{#if users.items.length === 0}
		<p class="text-sm text-muted-foreground">Aucun compte ne correspond.</p>
	{:else}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Compte</TableHead>
					<TableHead>Rôle</TableHead>
					<TableHead class="text-right">Commandes</TableHead>
					<TableHead class="text-right">Inscription</TableHead>
					<TableHead class="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each users.items as user (user.id)}
					<TableRow>
						<TableCell>
							<div class="font-medium">{user.email}</div>
							<div class="text-xs text-muted-foreground">
								{user.displayName ?? 'sans nom affiché'}
								{#if user.deletionRequestedAt}
									· suppression demandée le {dateFormatter.format(user.deletionRequestedAt)}
								{/if}
							</div>
						</TableCell>
						<TableCell>
							<Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
						</TableCell>
						<TableCell class="text-right tabular-nums">{user._count.orders}</TableCell>
						<TableCell class="text-right text-muted-foreground">
							{dateFormatter.format(user.createdAt)}
						</TableCell>
						<TableCell class="text-right">
							<div class="flex justify-end gap-2">
								<Button
									size="sm"
									variant="outline"
									disabled={pending === user.id}
									onclick={() =>
										run(user.id, () =>
											changeUserRole({
												userId: user.id,
												role: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
											})
										)}
								>
									{user.role === 'ADMIN' ? 'Retirer admin' : 'Nommer admin'}
								</Button>
								<Button
									size="sm"
									variant="destructive"
									disabled={pending === user.id}
									onclick={() => {
										if (
											window.confirm(
												`Supprimer définitivement ${user.email} ? Les commandes sont conservées mais détachées.`
											)
										) {
											run(user.id, () => deleteUserAccount(user.id));
										}
									}}
								>
									Supprimer
								</Button>
							</div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>

		{#if users.pageCount > 1}
			<div class="flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={users.page <= 1}
					onclick={() => apply({ page: users.page - 1 })}
				>
					Précédent
				</Button>
				<span class="text-sm text-muted-foreground">Page {users.page} / {users.pageCount}</span>
				<Button
					variant="outline"
					size="sm"
					disabled={users.page >= users.pageCount}
					onclick={() => apply({ page: users.page + 1 })}
				>
					Suivant
				</Button>
			</div>
		{/if}
	{/if}
</div>
