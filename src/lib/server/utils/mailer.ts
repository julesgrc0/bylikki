import nodemailer, { type Transporter } from 'nodemailer';
import type { Component } from 'svelte';
import { renderAsPlainText } from 'svelte-email-tailwind';
import { render } from 'svelte/server';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import OrderCancelled from '../emails/OrderCancelled.svelte';
import OrderConfirmation from '../emails/OrderConfirmation.svelte';
import OrderRefunded from '../emails/OrderRefunded.svelte';
import OrderShipped from '../emails/OrderShipped.svelte';
import OtpCode from '../emails/OtpCode.svelte';
import StockAlert from '../emails/StockAlert.svelte';

let transporter: Transporter | null = null;

function getTransporter() {
	if (!env.SMTP_HOST) {
		return null;
	}

	transporter ??= nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: Number(env.SMTP_PORT ?? '587'),
		secure: env.SMTP_SECURE === 'true',
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined
	});

	return transporter;
}

export type MailMessage = {
	to: string;
	subject: string;
	html: string;
	text: string;
};

/**
 * Envoie un e-mail transactionnel. Sans SMTP configure (developpement), le
 * message est ecrit en console plutot que perdu silencieusement.
 */
export async function sendMail({ to, subject, html, text }: MailMessage) {
	const mailer = getTransporter();

	if (!mailer) {
		if (!dev) {
			throw new Error("SMTP_HOST est absent : impossible d'envoyer l'e-mail.");
		}

		console.info(`[mail] destinataire=${to} sujet=${subject}\n${text}`);
		return;
	}

	await mailer.sendMail({
		from: env.SMTP_FROM ?? 'Bylikki <bonjour@bylikki.fr>',
		to,
		subject,
		html,
		text
	});
}

/**
 * Variante tolerante : un e-mail de confirmation ne doit jamais faire echouer
 * un paiement ni un webhook. L'echec est journalise, le parcours continue.
 */
export async function sendMailQuietly(message: MailMessage) {
	try {
		await sendMail(message);
	} catch (cause) {
		console.error(`[mail] echec destinataire=${message.to} sujet=${message.subject}`, cause);
	}
}

/**
 * Les gabarits sont des composants Svelte : meme charte que la boutique, et les
 * classes Tailwind sont converties en styles en ligne au build, seule forme que
 * les clients de messagerie savent lire de facon fiable. La version texte est
 * derivee du meme rendu, pour ne jamais avoir deux contenus a maintenir.
 */
function renderEmail<Props extends Record<string, unknown>>(
	component: Component<Props>,
	props: Props
) {
	const { body } = render(component, { props });

	return { html: body, text: renderAsPlainText(body) };
}

function formatAmount(cents: number, currency: string) {
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);
}

export type OrderMailContext = {
	reference: string;
	totalCents: number;
	currency: string;
	origin: string;
};

export function buildOtpMail(code: string, minutes: number, origin: string) {
	return {
		subject: `${code} — ton code de connexion Bylikki`,
		...renderEmail(OtpCode, { code, minutes, origin })
	};
}

export function buildOrderConfirmationMail(
	order: OrderMailContext & { invoiceNumber: number | null }
) {
	return {
		subject: `Commande ${order.reference} confirmée — Bylikki`,
		...renderEmail(OrderConfirmation, {
			reference: order.reference,
			amount: formatAmount(order.totalCents, order.currency),
			invoiceNumber: order.invoiceNumber,
			origin: order.origin
		})
	};
}

export function buildShippingMail(order: OrderMailContext & { trackingNumber: string | null }) {
	return {
		subject: `Commande ${order.reference} expédiée — Bylikki`,
		...renderEmail(OrderShipped, {
			reference: order.reference,
			trackingNumber: order.trackingNumber,
			origin: order.origin
		})
	};
}

export function buildCancellationMail(order: OrderMailContext) {
	return {
		subject: `Commande ${order.reference} annulée — Bylikki`,
		...renderEmail(OrderCancelled, { reference: order.reference, origin: order.origin })
	};
}

export function buildRefundMail(order: OrderMailContext) {
	return {
		subject: `Remboursement de la commande ${order.reference} — Bylikki`,
		...renderEmail(OrderRefunded, {
			reference: order.reference,
			amount: formatAmount(order.totalCents, order.currency),
			origin: order.origin
		})
	};
}

/** Alerte interne : une commande a ete payee alors que le stock ne suivait plus. */
export function buildStockAlertMail(input: {
	reference: string;
	shortages: { productName: string; variantLabel: string; missing: number }[];
	origin: string;
}) {
	return {
		subject: `Stock insuffisant sur la commande ${input.reference}`,
		...renderEmail(StockAlert, input)
	};
}
