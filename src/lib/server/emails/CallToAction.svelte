<script lang="ts">
	import { Column, Section } from 'svelte-email-tailwind';
	import { buttonStyleString } from './theme';

	type Props = { href: string; label: string };

	let { href, label }: Props = $props();
</script>

<Section style={{ padding: '10px 0' }}>
	<Column>
		<a {href} target="_blank" rel="noreferrer" style={buttonStyleString}>{label}</a>
	</Column>
</Section>
