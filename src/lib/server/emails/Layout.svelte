<script lang="ts">
	import type { Snippet } from 'svelte';
	import {
		Body,
		Column,
		Container,
		Head,
		Html,
		Link,
		Preview,
		Section,
		Text
	} from 'svelte-email-tailwind';
	import { styles } from './theme';

	type Props = {
		preview: string;
		eyebrow: string;
		title: string;
		origin: string;
		internal?: boolean;
		children: Snippet;
	};

	let { preview, eyebrow, title, origin, internal = false, children }: Props = $props();
</script>

<Html lang="fr">
	<Head />
	<Body style={styles.body}>
		<Preview {preview} />
		<Container style={styles.container}>
			<Section style={internal ? styles.headerAlert : styles.header}>
				<Column style={styles.headerCell}>
					<Text style={styles.wordmark}>BYLIKKI</Text>
					<Text style={styles.tagline}>
						{internal ? 'Alerte interne' : 'Bijoux et vêtements faits main'}
					</Text>
				</Column>
			</Section>

			<Section style={styles.card}>
				<Column style={styles.cardCell}>
					<Text style={styles.eyebrow}>{eyebrow}</Text>
					<Text style={styles.title}>{title}</Text>
					{@render children()}
				</Column>
			</Section>

			{#if !internal}
				<Section>
					<Column style={styles.footerCell}>
						<Text style={styles.footerText}>
							Cet e-mail t'est envoyé parce que tu as un compte ou une commande chez BYLIKKI.
						</Text>
						<Text style={{ ...styles.footerText, margin: '8px 0 0' }}>
							<Link href="{origin}/profile" style={styles.link}>Mon compte</Link>
							&nbsp;·&nbsp;
							<Link href="{origin}/legal?doc=rgpd" style={styles.link}>Confidentialité</Link>
						</Text>
					</Column>
				</Section>
			{/if}
		</Container>
	</Body>
</Html>
