/**
 * Identite du vendeur, obligatoire sur toute facture (art. L441-9 du code de
 * commerce). Ces valeurs sont des espaces reserves : elles doivent etre
 * completees avant la premiere vente, ici et dans `legal.ts`.
 */
export const seller = {
	name: 'BYLIKKI',
	legalForm: 'Micro-entreprise',
	addressLines: ['À compléter', '44000 Nantes', 'France'],
	siret: '000 000 000 00000',
	email: 'bonjour@bylikki.fr',
	vatMention: 'TVA non applicable, article 293 B du CGI'
} as const;
