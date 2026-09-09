<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = { productName: string; slug: string; origin: string };

	let { productName, slug, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Ton avis sur {productName}"
	eyebrow="Ton avis compte"
	title="Alors, cette pièce ?"
>
	<Text style={styles.text}>
		Ta commande est arrivée il y a quelques jours. Si « {productName} » te plaît — ou pas — quelques mots
		aideraient beaucoup les prochaines clientes à se décider.
	</Text>

	<CallToAction href="{origin}/{slug}#avis" label="Laisser un avis" />

	<Text style={styles.small}>C'est le seul rappel que tu recevras pour cette commande.</Text>
</Layout>
