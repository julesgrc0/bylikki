import nodemailer, { type Transporter } from 'nodemailer';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

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

type MailMessage = {
	to: string;
	subject: string;
	text: string;
};

/**
 * Envoie un e-mail transactionnel. Sans SMTP configure (developpement), le
 * message est ecrit en console plutot que perdu silencieusement.
 */
export async function sendMail({ to, subject, text }: MailMessage) {
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
		text
	});
}

export function buildOtpMail(code: string, minutes: number) {
	return {
		subject: `${code} — ton code de connexion Bylikki`,
		text: [
			'Bonjour,',
			'',
			`Voici ton code de connexion Bylikki : ${code}`,
			`Il est valable ${minutes} minutes et ne sert qu'une seule fois.`,
			'',
			"Si tu n'es pas à l'origine de cette demande, ignore simplement cet e-mail.",
			'',
			'À bientôt,',
			"L'atelier Bylikki"
		].join('\n')
	};
}
