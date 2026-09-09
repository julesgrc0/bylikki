<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = { reference: string; origin: string };

	let { reference, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Commande {reference} annulée"
	eyebrow="Annulation"
	title="Ta commande a été annulée"
>
	<Text style={styles.text}>
		La commande {reference} est annulée. Si elle avait déjà été payée, le remboursement est lancé et apparaîtra
		sur ton relevé sous quelques jours ouvrés.
	</Text>

	<CallToAction href="{origin}/search" label="Retourner à la boutique" />
</Layout>
