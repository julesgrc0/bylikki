import { resolve } from '$app/paths';

export const reviewCardBg = ['#FFF4C2', '#D8F0FB', '#FFE9F2', '#DDF4E2', '#E9DFFF'];
export const reviewCardRadius = [
	'30px 70px 26px 60px',
	'70px 26px 60px 30px',
	'26px 60px 30px 70px',
	'60px 30px 70px 26px'
];

export const beadPalette = [
	'#F0369B',
	'#FFDE59',
	'#A98BF5',
	'#6EC6EE',
	'#7ED598',
	'#FFD6E6',
	'#FF6F3C',
	'#FFFCF7'
];

export type NavLink = { label: string; href: string };

export const shopLinks: NavLink[] = [
	{ label: 'Nouveautés', href: resolve('/search?sort=nouveautes') },
	{ label: 'Bijoux', href: resolve('/search?category=bijoux') },
	{ label: 'Couture', href: resolve('/search?category=couture') },
	{ label: 'Upcycling', href: resolve('/search?category=upcycling') },
	{ label: 'Personnalisation', href: resolve('/search?query=personnalisable') },
	{ label: 'Tous les produits', href: resolve('/search') }
];

export const universeLinks: (NavLink & { bg: string; star: string })[] = [
	{
		label: 'BIJOUX',
		href: resolve('/search?category=bijoux'),
		bg: 'bg-yellow-soft',
		star: '#FFDE59'
	},
	{
		label: 'COUTURE',
		href: resolve('/search?category=couture'),
		bg: 'bg-blue-soft',
		star: '#6EC6EE'
	},
	{
		label: 'UPCYCLING',
		href: resolve('/search?category=upcycling'),
		bg: 'bg-green-soft',
		star: '#7ED598'
	}
];

export const infoLinks: NavLink[] = [
	{ label: 'Suivre ma commande', href: resolve('/suivi') },
	{ label: 'Avis', href: resolve('/#avis') },
	{ label: 'À propos', href: resolve('/#a-propos') },
	{ label: 'CGU', href: resolve('/legal?doc=cgu') },
	{ label: 'CGV', href: resolve('/legal?doc=cgv') },
	{ label: 'Politique de confidentialité', href: resolve('/legal?doc=rgpd') },
	{ label: 'Cookies', href: resolve('/legal?doc=cookies') }
];

export const socialLinks: NavLink[] = [
	{ label: 'Instagram', href: 'https://www.instagram.com/' },
	{ label: 'TikTok', href: 'https://www.tiktok.com/' },
	{ label: 'Pinterest', href: 'https://www.pinterest.fr/' }
];
