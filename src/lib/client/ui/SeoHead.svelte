<script lang="ts">
	type Props = {
		title: string;
		description: string;
		canonical: string;
		image?: string | null;
		type?: 'website' | 'article' | 'product';
		noindex?: boolean;
		structuredData?: unknown;
	};

	let {
		title,
		description,
		canonical,
		image = null,
		type = 'website',
		noindex = false,
		structuredData = null
	}: Props = $props();

	/**
	 * Le JSON-LD est insere tel quel : on neutralise les sequences qui
	 * pourraient fermer la balise ou ouvrir un commentaire HTML. Le nom de la
	 * balise est interpole pour que ce fichier ne contienne aucune balise
	 * fermante litterale, qui terminerait ce bloc prematurement.
	 */
	const scriptTag = 'script';
	const jsonLdTag = $derived(
		structuredData === null
			? null
			: `<${scriptTag} type="application/ld+json">${JSON.stringify(structuredData)
					.replace(/</g, '\\u003c')
					.replace(/>/g, '\\u003e')
					.replace(/&/g, '\\u0026')}</${scriptTag}>`
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}
		<meta name="robots" content="noindex, follow" />
	{/if}

	<meta property="og:site_name" content="BYLIKKI" />
	<meta property="og:locale" content="fr_FR" />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	{#if image}
		<meta property="og:image" content={image} />
	{/if}

	<meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if image}
		<meta name="twitter:image" content={image} />
	{/if}

	{#if jsonLdTag}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html jsonLdTag}
	{/if}
</svelte:head>
