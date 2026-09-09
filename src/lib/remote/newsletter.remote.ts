import { error } from '@sveltejs/kit';
import {
	createIssue,
	deleteIssue,
	findSendableIssue,
	listIssues,
	listSubscribers,
	markIssueSent
} from '#lib/server/database/newsletter';
import NewsletterEmail from '#lib/server/emails/Newsletter.svelte';
import { requireAdmin } from '#lib/server/security/guard';
import { signUnsubscribe } from '#lib/server/security/hash';
import { renderEmail, sendMailQuietly } from '#lib/server/utils/mailer';
import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(80));

export const issueSchema = v.object({
	subject: v.pipe(
		v.string('Donne un objet à cette lettre.'),
		v.trim(),
		v.minLength(3, 'Cet objet est trop court.'),
		v.maxLength(120, 'Cet objet est trop long.')
	),
	body: v.pipe(
		v.string('Écris le contenu de la lettre.'),
		v.trim(),
		v.minLength(20, 'Cette lettre est trop courte.'),
		v.maxLength(8000, 'Cette lettre est trop longue.')
	)
});

export const getIssues = query(async () => {
	requireAdmin();

	return listIssues();
});

export const saveIssue = command(issueSchema, async (input) => {
	requireAdmin();

	const created = await createIssue(input);
	await getIssues().refresh();

	return created;
});

export const removeIssue = command(identifierSchema, async (id) => {
	requireAdmin();

	const deleted = await deleteIssue(id);

	if (deleted.count === 0) {
		error(409, 'Une lettre déjà envoyée ne peut plus être supprimée.');
	}

	await getIssues().refresh();

	return { deleted: true };
});

/**
 * L'envoi est marque avant d'expedier : si le processus s'interrompt, la
 * lettre ne repart pas en double a celles qui l'avaient deja recue.
 */
export const sendIssue = command(identifierSchema, async (id) => {
	requireAdmin();

	const issue = await findSendableIssue(id);

	if (!issue) {
		error(409, 'Cette lettre a déjà été envoyée.');
	}

	const subscribers = await listSubscribers();
	const origin = getRequestEvent().url.origin;

	await markIssueSent(issue.id, subscribers.length);

	const paragraphs = issue.body
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (const subscriber of subscribers) {
		const unsubscribeUrl = `${origin}/desinscription?u=${subscriber.id}&s=${signUnsubscribe(subscriber.id)}`;

		await sendMailQuietly({
			to: subscriber.email,
			subject: issue.subject,
			...renderEmail(NewsletterEmail, {
				title: issue.subject,
				paragraphs,
				unsubscribeUrl,
				origin
			})
		});
	}

	await getIssues().refresh();

	return { sent: subscribers.length };
});
