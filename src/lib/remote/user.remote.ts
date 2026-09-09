import { error, invalid } from '@sveltejs/kit';
import { avatarSchema } from '#lib/client/validation/media';
import { addressSchema, consentSchema, profileSchema } from '#lib/client/validation/profile';
import { listActiveSessions, revokeSessionForUser } from '#lib/server/database/auth';
import {
	cancelAccountDeletion,
	collectUserData,
	deleteAddress as deleteAddressRecord,
	findUserById,
	listAddresses,
	listConsents,
	requestAccountDeletion,
	saveAddress,
	setConsent,
	updateUserAvatar,
	updateUserProfile
} from '#lib/server/database/user';
import { requireUser } from '#lib/server/security/guard';
import { endAllSessions } from '#lib/server/security/session';
import { deleteImage, isBlobConfigured, uploadImage } from '#lib/server/utils/blob';
import * as v from 'valibot';
import { command, form, getRequestEvent, query } from '$app/server';

const identifierSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(64));

export const getProfile = query(async () => {
	const sessionUser = requireUser();
	const [user, addresses, consents] = await Promise.all([
		findUserById(sessionUser.id),
		listAddresses(sessionUser.id),
		listConsents(sessionUser.id)
	]);

	if (!user) {
		error(404, 'Ce compte est introuvable.');
	}

	return { user, addresses, consents };
});

export const listMySessions = query(async () => {
	const user = requireUser();
	const sessions = await listActiveSessions(user.id);
	const current = getRequestEvent().locals.session?.id ?? null;

	return sessions.map((session) => ({ ...session, isCurrent: session.id === current }));
});

export const updateProfile = form(profileSchema, async ({ displayName, phone }) => {
	const user = requireUser();

	await updateUserProfile(user.id, {
		displayName: displayName === '' ? null : displayName,
		phone: phone === '' ? null : phone
	});

	await getProfile().refresh();

	return { saved: true };
});

export const upsertAddress = form(addressSchema, async (input, issue) => {
	const user = requireUser();
	const { addressId, ...address } = input;

	const saved = await saveAddress(user.id, addressId === '' ? null : addressId, {
		...address,
		label: address.label === '' ? null : address.label,
		line2: address.line2 === '' ? null : address.line2
	});

	if (!saved) {
		invalid(issue.line1("Cette adresse n'existe plus."));
	}

	await getProfile().refresh();

	return { saved: true };
});

/** Photo de profil : convertie en WebP et servie depuis le stockage Blob. */
export const updateAvatar = form(avatarSchema, async ({ photo }, issue) => {
	const user = requireUser();

	if (!isBlobConfigured()) {
		invalid(issue.photo("L'envoi de photos est momentanément indisponible."));
	}

	const current = await findUserById(user.id);

	let uploaded;

	try {
		uploaded = await uploadImage('avatars', photo, 'avatar');
	} catch {
		invalid(issue.photo("Cette photo n'a pas pu être envoyée. Réessaie dans un instant."));
	}

	await updateUserAvatar(user.id, uploaded.url);
	await deleteImage(current?.avatarUrl ?? null);
	await getProfile().refresh();

	return { saved: true };
});

export const removeAvatar = command(async () => {
	const user = requireUser();
	const current = await findUserById(user.id);

	await updateUserAvatar(user.id, null);
	await deleteImage(current?.avatarUrl ?? null);
	await getProfile().refresh();

	return { removed: true };
});

export const deleteAddress = command(identifierSchema, async (addressId) => {
	const user = requireUser();
	const deleted = await deleteAddressRecord(user.id, addressId);

	if (deleted.count === 0) {
		error(404, 'Cette adresse est introuvable.');
	}

	await getProfile().refresh();

	return { deleted: true };
});

export const updateConsent = command(consentSchema, async ({ type, granted }) => {
	const user = requireUser();
	const consent = await setConsent(user.id, type, granted);

	await getProfile().refresh();

	return consent;
});

export const revokeMySession = command(identifierSchema, async (sessionId) => {
	const user = requireUser();
	const revoked = await revokeSessionForUser(sessionId, user.id, 'USER_REQUEST');

	if (revoked.count === 0) {
		error(404, 'Cette session est introuvable.');
	}

	await listMySessions().refresh();

	return { revoked: true };
});

/** Droit d'acces et de portabilite : l'integralite du compte, en JSON. */
export const exportMyData = command(async () => {
	const user = requireUser();

	return collectUserData(user.id);
});

/**
 * Droit a l'effacement : la demande est enregistree, les sessions sont fermees
 * et le compte est purge apres le delai d'annulation annonce.
 */
export const requestDeletion = command(async () => {
	const event = getRequestEvent();
	const user = requireUser();

	const updated = await requestAccountDeletion(user.id);
	await endAllSessions(event, user.id, 'ACCOUNT_DELETION');

	return { requestedAt: updated.deletionRequestedAt };
});

export const cancelDeletion = command(async () => {
	const user = requireUser();
	await cancelAccountDeletion(user.id);
	await getProfile().refresh();

	return { cancelled: true };
});
