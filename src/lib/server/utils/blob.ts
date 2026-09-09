import { del, put } from '@vercel/blob';
import { env } from '$env/dynamic/private';
import { processImage, type imagePresets } from './images';

/** Au-dela de ce delai, mieux vaut une erreur claire qu'un formulaire fige. */
const UPLOAD_TIMEOUT_MS = 20_000;

/**
 * Le SDK Blob retente plusieurs fois : on borne nous-memes l'attente pour
 * qu'un stockage injoignable rende la main plutot que de figer le formulaire.
 */
function withTimeout<T>(operation: Promise<T>, label: string) {
	return Promise.race([
		operation,
		new Promise<never>((_, reject) => {
			setTimeout(
				() => reject(new Error(`${label} : le stockage n'a pas repondu a temps.`)),
				UPLOAD_TIMEOUT_MS
			);
		})
	]);
}

function readToken() {
	if (!env.BLOB_READ_WRITE_TOKEN) {
		throw new Error("BLOB_READ_WRITE_TOKEN est absent : impossible de stocker l'image.");
	}

	return env.BLOB_READ_WRITE_TOKEN;
}

export function isBlobConfigured() {
	return Boolean(env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Convertit l'image en WebP puis la depose sur Vercel Blob. Le chemin ne
 * contient jamais le nom du fichier d'origine, qui peut etre identifiant.
 */
export async function uploadImage(
	folder: 'avatars' | 'avis',
	file: File,
	preset: keyof typeof imagePresets
) {
	const image = await processImage(file, preset);

	const blob = await withTimeout(
		put(`${folder}/image.${image.extension}`, image.data, {
			access: 'public',
			addRandomSuffix: true,
			contentType: image.contentType,
			cacheControlMaxAge: 60 * 60 * 24 * 365,
			abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
			token: readToken(),
			...(env.BLOB_STORE_ID ? { storeId: env.BLOB_STORE_ID } : {})
		}),
		'envoi'
	);

	return { url: blob.url, width: image.width, height: image.height };
}

/** La suppression ne doit jamais faire echouer l'action metier qui l'accompagne. */
export async function deleteImage(url: string | null) {
	if (!url || !isBlobConfigured()) {
		return;
	}

	try {
		await withTimeout(
			del(url, { token: readToken(), abortSignal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS) }),
			'suppression'
		);
	} catch (error) {
		console.warn('[blob] suppression impossible', error);
	}
}
