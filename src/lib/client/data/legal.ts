export type LegalBlock = { h: string; p: string };

export type LegalDoc = {
	id: string;
	label: string;
	tag: string;
	title: string;
	updated: string;
	blocks: LegalBlock[];
};

export const legalDocs: LegalDoc[] = [
	{
		id: 'cgu',
		label: 'Conditions d’utilisation',
		tag: 'CGU',
		title: 'Conditions générales d’utilisation',
		updated: '14 juillet 2026',
		blocks: [
			{
				h: 'Objet',
				p: 'Les présentes conditions régissent l’accès au site bylikki.fr et son utilisation. Elles s’appliquent dès la première visite, que tu crées un compte ou non.'
			},
			{
				h: 'Éditeur du site',
				p: 'BYLIKKI, micro-entreprise immatriculée à Nantes, SIRET 000 000 000 00000. Contact : bonjour@bylikki.fr.'
			},
			{
				h: 'Compte client',
				p: 'La création d’un compte se fait par vérification d’adresse e-mail au moyen d’un code à usage unique. Ce code est personnel : ne le transmets à personne, y compris à une personne se présentant comme faisant partie de BYLIKKI.'
			},
			{
				h: 'Propriété intellectuelle',
				p: 'Photos, textes, motifs et visuels du site sont la propriété de BYLIKKI. Toute reproduction, même partielle, sans accord écrit préalable est interdite. Le partage sur les réseaux avec mention du compte reste bienvenu.'
			},
			{
				h: 'Disponibilité',
				p: 'Le site peut être momentanément indisponible pour maintenance. Aucune indemnité ne peut être réclamée à ce titre.'
			},
			{
				h: 'Modification des conditions',
				p: 'Toute nouvelle version est publiée sur cette page avec sa date de mise à jour. Les commandes déjà passées restent régies par la version en vigueur au moment de l’achat.'
			}
		]
	},
	{
		id: 'cgv',
		label: 'Conditions de vente',
		tag: 'CGV',
		title: 'Conditions générales de vente',
		updated: '14 juillet 2026',
		blocks: [
			{
				h: 'Prix',
				p: 'Les prix sont indiqués en euros, toutes taxes comprises. TVA non applicable, article 293 B du Code général des impôts. Les frais de livraison sont annoncés avant le paiement.'
			},
			{
				h: 'Commande',
				p: 'La commande est ferme à réception du paiement. Un e-mail de confirmation récapitule les pièces, le montant et l’adresse de livraison.'
			},
			{
				h: 'Paiement',
				p: 'Paiement par carte bancaire via Stripe. Aucune donnée bancaire n’est stockée par BYLIKKI.'
			},
			{
				h: 'Fabrication et délais',
				p: 'Les pièces sont faites à la main, en petites séries. Compte 2 à 5 jours ouvrés de préparation avant expédition, et jusqu’à 10 jours pour une pièce personnalisée.'
			},
			{
				h: 'Livraison',
				p: 'Colissimo suivi : 4,90 € en France métropolitaine, offert dès 50 € d’achat. Union européenne : 9,90 €. En cas de colis perdu, une enquête est ouverte auprès du transporteur avant réexpédition ou remboursement.'
			},
			{
				h: 'Droit de rétractation',
				p: 'Tu disposes de 14 jours à compter de la réception pour te rétracter, sans motif. Les pièces personnalisées et les boucles d’oreilles décachetées en sont exclues, conformément à l’article L221-28 du Code de la consommation.'
			},
			{
				h: 'Garanties',
				p: 'Les garanties légales de conformité et des vices cachés s’appliquent. Un défaut constaté dans les 30 jours donne droit à réparation, échange ou remboursement.'
			}
		]
	},
	{
		id: 'rgpd',
		label: 'Confidentialité (RGPD)',
		tag: 'RGPD',
		title: 'Politique de confidentialité',
		updated: '02 août 2026',
		blocks: [
			{
				h: 'Données collectées',
				p: 'Adresse e-mail, nom, adresse de livraison, historique de commandes et, si tu l’écris, le petit mot joint au colis. Aucune donnée sensible n’est demandée.'
			},
			{
				h: 'Finalités',
				p: 'Traiter et livrer les commandes, gérer les retours et le service après-vente, envoyer des nouveautés uniquement si tu y as consenti.'
			},
			{
				h: 'Base légale',
				p: 'Exécution du contrat pour les commandes, consentement pour les e-mails de nouveautés, obligation légale pour la conservation des factures.'
			},
			{
				h: 'Durée de conservation',
				p: 'Compte et historique : 3 ans après le dernier achat. Factures : 10 ans, obligation comptable. Les codes de connexion expirent après 10 minutes.'
			},
			{
				h: 'Sous-traitants',
				p: 'Stripe (paiement), La Poste / Colissimo (livraison), Brevo (envoi d’e-mails). Aucune donnée n’est vendue ni cédée à des fins publicitaires.'
			},
			{
				h: 'Tes droits',
				p: 'Accès, rectification, effacement, portabilité, opposition et limitation. Tout est accessible depuis Mon espace → Paramètres, ou par e-mail à privacy@bylikki.fr. Réclamation possible auprès de la CNIL.'
			}
		]
	},
	{
		id: 'cookies',
		label: 'Cookies',
		tag: 'Cookies',
		title: 'Gestion des cookies',
		updated: '02 août 2026',
		blocks: [
			{
				h: 'Cookies essentiels',
				p: 'Nécessaires au panier et à la session de connexion. Ils ne peuvent pas être désactivés, et ne servent à rien d’autre.'
			},
			{
				h: 'Mesure d’audience',
				p: 'Statistiques anonymes de fréquentation, sans identifiant publicitaire ni revente. Désactivable depuis le bandeau ou tes paramètres.'
			},
			{
				h: 'Aucune publicité',
				p: 'Pas de cookie publicitaire, pas de pixel de réseau social, pas de reciblage.'
			},
			{
				h: 'Durée',
				p: 'Session pour le panier, 13 mois maximum pour la mesure d’audience.'
			}
		]
	},
	{
		id: 'retours',
		label: 'Retours & remboursements',
		tag: 'Retours',
		title: 'Retours et remboursements',
		updated: '14 juillet 2026',
		blocks: [
			{
				h: 'Délai',
				p: '14 jours après réception pour demander un retour, depuis Mon espace → Mes achats → Demander un retour.'
			},
			{
				h: 'État du produit',
				p: 'La pièce doit être non portée, complète et dans son emballage d’origine. Le petit mot manuscrit peut rester, ça ne change rien.'
			},
			{
				h: 'Frais de retour',
				p: 'Étiquette prépayée fournie pour la France métropolitaine. Hors France, les frais de renvoi restent à ta charge sauf défaut de fabrication.'
			},
			{
				h: 'Remboursement',
				p: 'Sous 5 jours ouvrés après réception du colis retour, sur le moyen de paiement d’origine. Les frais de livraison initiaux sont remboursés en cas de retour intégral.'
			},
			{
				h: 'Exclusions',
				p: 'Pièces personnalisées et boucles d’oreilles décachetées, sauf défaut constaté. Dans ce cas, une photo par e-mail suffit à ouvrir un échange.'
			}
		]
	},
	{
		id: 'mentions',
		label: 'Mentions légales',
		tag: 'Mentions',
		title: 'Mentions légales',
		updated: '14 juillet 2026',
		blocks: [
			{
				h: 'Éditeur',
				p: 'BYLIKKI, micro-entreprise, Nantes (44). SIRET 000 000 000 00000. Responsable de publication : la fondatrice.'
			},
			{
				h: 'Hébergement',
				p: 'Site hébergé dans l’Union européenne. Coordonnées complètes de l’hébergeur disponibles sur demande à bonjour@bylikki.fr.'
			},
			{
				h: 'Médiation',
				p: 'En cas de litige non résolu, tu peux saisir gratuitement un médiateur de la consommation dans l’année suivant la réclamation écrite.'
			},
			{
				h: 'Droit applicable',
				p: 'Droit français. En cas de litige, les tribunaux français sont compétents.'
			}
		]
	}
];

export const findLegalDoc = (id: string | null): LegalDoc =>
	legalDocs.find((d) => d.id === id) ?? legalDocs[0];
