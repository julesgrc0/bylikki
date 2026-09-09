<script lang="ts">
	import { Column, Hr, Section, Text } from 'svelte-email-tailwind';
	import CallToAction from './CallToAction.svelte';
	import Layout from './Layout.svelte';
	import {
		highlight,
		highlightLabel,
		highlightValue,
		linkStyleString,
		palette,
		styles
	} from './theme';

	type Props = {
		reference: string;
		amount: string;
		invoiceNumber: number | null;
		origin: string;
	};

	let { reference, amount, invoiceNumber, origin }: Props = $props();
</script>

<Layout
	{origin}
	preview="Commande {reference} confirmée"
	eyebrow="Commande confirmée"
	title="Merci pour ta commande"
>
	<Text style={styles.text}>
		Ton paiement est bien passé. Ta commande part en préparation à l'atelier, et tu recevras un
		e-mail dès qu'elle sera expédiée.
	</Text>

	<Section style={{ padding: '8px 0 16px' }}>
		<Column style={highlight(palette.pinkPale)}>
			<Text style={highlightLabel}>Référence</Text>
			<Text style={highlightValue}>{reference}</Text>
			<Hr style={{ borderTop: `2px solid ${palette.ink}`, margin: '16px 0' }} />
			<Text style={highlightLabel}>Total réglé</Text>
			<Text style={highlightValue}>{amount}</Text>
		</Column>
	</Section>

	<CallToAction href="{origin}/profile" label="Suivre ma commande" />

	{#if invoiceNumber}
		<Text style={{ ...styles.small, marginTop: '12px' }}>
			Ta facture est disponible ici :
			<a href="{origin}/profile/commande/{reference}/facture" style={linkStyleString}>
				facture n° {invoiceNumber}
			</a>.
		</Text>
	{/if}
</Layout>
