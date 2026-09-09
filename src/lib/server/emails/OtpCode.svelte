<script lang="ts">
	import { Column, Section, Text } from 'svelte-email-tailwind';
	import Layout from './Layout.svelte';
	import { highlight, palette, styles } from './theme';

	type Props = { code: string; minutes: number; origin: string };

	let { code, minutes, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Ton code de connexion Bylikki : {code}"
	eyebrow="Connexion"
	title="Voici ton code"
>
	<Text style={styles.text}>
		Saisis-le sur le site pour te connecter. Il est valable {minutes} minutes et ne sert qu'une seule
		fois.
	</Text>

	<Section style={{ padding: '8px 0 16px' }}>
		<Column style={{ ...highlight(palette.yellowSoft), textAlign: 'center' }}>
			<Text style={styles.code}>{code}</Text>
		</Column>
	</Section>

	<Text style={styles.small}>
		Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail. Personne de chez
		BYLIKKI ne te demandera jamais ce code.
	</Text>
</Layout>
