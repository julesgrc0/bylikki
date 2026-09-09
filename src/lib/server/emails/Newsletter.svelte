<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import Layout from './Layout.svelte';
	import { linkStyleString, styles } from './theme';

	type Props = { title: string; paragraphs: string[]; unsubscribeUrl: string; origin: string };

	let { title, paragraphs, unsubscribeUrl, origin }: Props = $props();
</script>

<Layout {origin} preview={title} eyebrow="Des nouvelles de l'atelier" {title}>
	{#each paragraphs as paragraph, index (index)}
		<Text style={styles.text}>{paragraph}</Text>
	{/each}

	<Text style={{ ...styles.small, marginTop: '20px' }}>
		Tu reçois cette lettre parce que tu l'as demandée dans ton compte.
		<a href={unsubscribeUrl} style={linkStyleString}>Se désinscrire en un clic</a>.
	</Text>
</Layout>
