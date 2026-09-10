<script lang="ts">
	import { Column, Section, Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { highlight, highlightLabel, highlightValue, palette, styles } from './theme';

	type Props = { reference: string; trackingNumber: string | null; origin: string };

	let { reference, trackingNumber, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Commande {reference} expédiée"
	eyebrow="En route"
	title="Ta commande est partie"
>
	<Text style={styles.text}>
		La commande {reference} vient de quitter l'atelier. Encore un peu de patience.
	</Text>

	{#if trackingNumber}
		<Section style={{ padding: '8px 0 16px' }}>
			<Column style={highlight(palette.blueSoft)}>
				<Text style={{ ...highlightLabel, color: palette.ink }}>Numéro de suivi</Text>
				<Text style={highlightValue}>{trackingNumber}</Text>
			</Column>
		</Section>
	{/if}

	<CallToAction href="{origin}/suivi" label="Suivre ma commande" />

	<Text style={styles.small}>
		Le suivi fonctionne sans connexion : la référence {reference} et ton adresse e-mail suffisent.
	</Text>
</Layout>
