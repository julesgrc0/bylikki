<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = { reference: string; pieces: string[]; origin: string };

	let { reference, pieces, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Demande de retour pour la commande {reference}"
	eyebrow="Retour"
	title="On a bien reçu ta demande"
>
	<Text style={styles.text}>
		Ta demande de retour pour la commande {reference} est enregistrée. On la regarde et on te répond très
		vite avec la marche à suivre.
	</Text>

	{#each pieces as piece (piece)}
		<Text style={{ ...styles.small, margin: '0 0 4px' }}>• {piece}</Text>
	{/each}

	<Text style={{ ...styles.small, marginTop: '14px' }}>
		En attendant, garde la pièce dans son emballage d'origine. Le petit mot manuscrit peut rester,
		ça ne change rien.
	</Text>

	<CallToAction href="{origin}/profile" label="Suivre ma demande" />
</Layout>
