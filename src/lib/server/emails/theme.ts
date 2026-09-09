/**
 * Charte de la boutique traduite en styles en ligne. Les clients de messagerie
 * ignorent les feuilles de style externes et la plupart des selecteurs : seuls
 * les attributs `style` sont lus de facon fiable partout.
 */
export const palette = {
	ink: '#2e1b33',
	cream: '#fff9f2',
	paper: '#fffcf7',
	pink: '#f0369b',
	pinkDeep: '#c41f77',
	pinkSoft: '#ffe9f2',
	pinkPale: '#fff0f6',
	yellowSoft: '#fff4c2',
	blueSoft: '#d8f0fb',
	greenSoft: '#ddf4e2',
	white: '#ffffff'
} as const;

export const fontStack = "'Quicksand', 'Trebuchet MS', -apple-system, sans-serif";

export const styles = {
	body: { margin: '0', padding: '0', backgroundColor: palette.cream, fontFamily: fontStack },
	container: { maxWidth: '560px', padding: '32px 16px' },
	header: {
		backgroundColor: palette.pinkSoft,
		border: `2px solid ${palette.ink}`,
		borderBottom: 'none',
		borderRadius: '22px 22px 0 0'
	},
	headerAlert: {
		backgroundColor: palette.yellowSoft,
		border: `2px solid ${palette.ink}`,
		borderBottom: 'none',
		borderRadius: '22px 22px 0 0'
	},
	headerCell: { padding: '26px 30px' },
	wordmark: {
		margin: '0',
		fontSize: '22px',
		fontWeight: '700',
		letterSpacing: '0.22em',
		textTransform: 'uppercase',
		color: palette.ink
	},
	tagline: { margin: '4px 0 0', fontSize: '13px', color: palette.ink },
	card: {
		backgroundColor: palette.paper,
		border: `2px solid ${palette.ink}`,
		borderRadius: '0 0 22px 22px'
	},
	cardCell: { padding: '30px' },
	eyebrow: {
		margin: '0',
		fontSize: '11px',
		fontWeight: '700',
		letterSpacing: '0.18em',
		textTransform: 'uppercase',
		color: palette.pinkDeep
	},
	title: {
		margin: '8px 0 18px',
		fontSize: '24px',
		lineHeight: '1.2',
		fontWeight: '700',
		color: palette.ink
	},
	text: { margin: '0 0 12px', fontSize: '15px', lineHeight: '1.6', color: palette.ink },
	small: { margin: '0', fontSize: '13px', lineHeight: '1.6', color: palette.ink },
	button: {
		display: 'inline-block',
		backgroundColor: palette.pink,
		color: palette.white,
		border: `2px solid ${palette.ink}`,
		borderRadius: '16px',
		padding: '13px 24px',
		fontSize: '15px',
		fontWeight: '700',
		textDecoration: 'none'
	},
	code: {
		margin: '0',
		fontSize: '34px',
		lineHeight: '1',
		fontWeight: '700',
		letterSpacing: '0.32em',
		color: palette.ink
	},
	footerText: {
		margin: '0',
		fontSize: '12px',
		lineHeight: '1.6',
		color: palette.ink,
		textAlign: 'center'
	},
	footerCell: { padding: '22px 30px 0' },
	link: { color: palette.pinkDeep, textDecoration: 'underline' }
} as const;

/**
 * Le bouton est un `<a>` simple : les composants de la librairie serialisent
 * leurs proprietes de padding dans l'attribut `style`, ce que les clients de
 * messagerie recopient tel quel.
 */
export const buttonStyleString = [
	'display:inline-block',
	`background-color:${palette.pink}`,
	`color:${palette.white}`,
	`border:2px solid ${palette.ink}`,
	'border-radius:16px',
	'padding:13px 24px',
	'font-size:15px',
	'font-weight:700',
	'line-height:1',
	'text-decoration:none'
].join(';');

export const linkStyleString = `color:${palette.pinkDeep};text-decoration:underline`;

/** Encart colore : reference de commande, numero de suivi, montant rembourse. */
export function highlight(backgroundColor: string) {
	return {
		backgroundColor,
		border: `2px solid ${palette.ink}`,
		borderRadius: '18px',
		padding: '20px 24px'
	};
}

export const highlightLabel = {
	margin: '0',
	fontSize: '12px',
	fontWeight: '700',
	letterSpacing: '0.16em',
	textTransform: 'uppercase',
	color: palette.pinkDeep
} as const;

export const highlightValue = {
	margin: '4px 0 0',
	fontSize: '20px',
	fontWeight: '700',
	color: palette.ink
} as const;
