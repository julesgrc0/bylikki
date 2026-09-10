<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = {
		reference: string;
		accepted: boolean;
		note: string | null;
		origin: string;
	};

	let { reference, accepted, note, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Ta demande de retour pour {reference}"
	eyebrow="Retour"
	title={accepted ? 'Ton retour est accepté' : 'Ta demande de retour'}
>
	<Text style={styles.text}>
		{#if accepted}
			On accepte le retour de la commande {reference}. Renvoie la pièce dans son emballage d'origine
			; dès réception, le remboursement part sous cinq jours ouvrés.
		{:else}
			Après examen, on ne peut pas donner suite au retour de la commande {reference}.
		{/if}
	</Text>

	{#if note}
		<Text style={styles.small}>{note}</Text>
	{/if}

	<CallToAction href="{origin}/profile" label="Voir ma demande" />
</Layout>
