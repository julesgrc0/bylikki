<script lang="ts">
	import { Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import { styles } from './theme';

	type Props = { productName: string; variantLabel: string; slug: string; origin: string };

	let { productName, variantLabel, slug, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="{productName} est de retour"
	eyebrow="Retour en stock"
	title="{productName} est de nouveau là"
>
	<Text style={styles.text}>
		Tu avais demandé à être prévenue : « {productName} » ({variantLabel}) vient de revenir en
		boutique. Les pièces partent vite, et celle-ci n'attendra peut-être pas.
	</Text>

	<CallToAction href="{origin}/{slug}" label="Voir la pièce" />

	<Text style={styles.small}>
		Tu reçois ce message parce que tu as activé les alertes de retour en stock dans ton compte. Tu
		peux les désactiver à tout moment depuis tes préférences.
	</Text>
</Layout>
