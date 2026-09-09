<script lang="ts">
	import { Column, Section, Text } from 'svelte-email-tailwind';
	import Layout from './Layout.svelte';
	import { highlight, highlightLabel, highlightValue, palette, styles } from './theme';

	type Props = { reference: string; amount: string; origin: string };

	let { reference, amount, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Remboursement de la commande {reference}"
	eyebrow="Remboursement"
	title="Ton remboursement est parti"
>
	<Text style={styles.text}>
		Le remboursement de la commande {reference} a été effectué.
	</Text>

	<Section style={{ padding: '8px 0 16px' }}>
		<Column style={highlight(palette.greenSoft)}>
			<Text style={{ ...highlightLabel, color: palette.ink }}>Montant remboursé</Text>
			<Text style={highlightValue}>{amount}</Text>
		</Column>
	</Section>

	<Text style={styles.small}>
		Le délai d'apparition sur ton relevé dépend de ta banque, en général deux à cinq jours ouvrés.
	</Text>
</Layout>
