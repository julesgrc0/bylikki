<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = {
		reference: string;
		shortages: { productName: string; variantLabel: string; missing: number }[];
		origin: string;
	};

	let { reference, shortages, origin }: Props = $props();
</script>

<Layout
	{origin}
	internal
	preview="Stock insuffisant sur la commande {reference}"
	eyebrow="À traiter"
	title="Stock insuffisant sur une commande payée"
>
	<Text style={styles.text}>
		La commande {reference} a été payée alors que le stock ne couvrait pas toutes les lignes. Le stock
		des variantes concernées a été ramené à zéro et la commande est signalée dans le tableau de bord.
	</Text>

	{#each shortages as shortage (shortage.productName + shortage.variantLabel)}
		<Text style={{ ...styles.small, margin: '0 0 4px' }}>
			• {shortage.productName} ({shortage.variantLabel}) : {shortage.missing} manquant(s)
		</Text>
	{/each}

	<CallToAction href="{origin}/admin/commandes/{reference}" label="Ouvrir la commande" />
</Layout>
