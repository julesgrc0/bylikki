<script lang="ts">
	import BoxIcon from '@lucide/svelte/icons/box';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import StoreIcon from '@lucide/svelte/icons/store';
	import TagsIcon from '@lucide/svelte/icons/tags';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { Separator } from '#lib/client/ui/shadcn/separator';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children, data } = $props();

	const links = [
		{ href: resolve('/admin'), label: 'Tableau de bord', icon: LayoutDashboardIcon, exact: true },
		{ href: resolve('/admin/produits'), label: 'Produits', icon: BoxIcon, exact: false },
		{ href: resolve('/admin/commandes'), label: 'Commandes', icon: ReceiptIcon, exact: false },
		{ href: resolve('/admin/comptes'), label: 'Comptes', icon: UsersIcon, exact: false },
		{ href: resolve('/admin/avis'), label: 'Avis', icon: MessageSquareIcon, exact: false },
		{ href: resolve('/admin/catalogue'), label: 'Catalogue', icon: TagsIcon, exact: false }
	];

	const isActive = (link: (typeof links)[number]) =>
		link.exact ? page.url.pathname === link.href : page.url.pathname.startsWith(link.href);
</script>

<svelte:head>
	<title>Administration — BYLIKKI</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell flex min-h-screen flex-col md:flex-row">
	<aside class="w-full shrink-0 border-b bg-card p-4 md:w-60 md:border-r md:border-b-0">
		<div class="mb-4 flex items-center justify-between gap-2">
			<div>
				<div class="text-sm font-semibold">Administration</div>
				<div class="truncate text-xs text-muted-foreground">{data.admin.email}</div>
			</div>
		</div>

		<nav class="flex flex-wrap gap-1 md:flex-col">
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={isActive(link) ? 'page' : undefined}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground {isActive(
						link
					)
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground'}"
				>
					<link.icon class="size-4" />
					{link.label}
				</a>
			{/each}
		</nav>

		<Separator class="my-4 hidden md:block" />

		<a
			href={resolve('/')}
			class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
		>
			<StoreIcon class="size-4" />
			Retour à la boutique
		</a>
	</aside>

	<main class="min-w-0 flex-1 p-4 md:p-8">
		{@render children()}
	</main>
</div>
