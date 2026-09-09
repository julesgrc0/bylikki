import * as v from 'valibot';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_REVIEW_PHOTOS = 3;

export const acceptedImageTypes = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/avif'
] as const satisfies `${string}/${string}`[];

/** Attribut `accept` des champs de fichier, garde en phase avec la validation. */
export const imageAccept = acceptedImageTypes.join(',');

export const imageFileSchema = v.pipe(
	v.file('Choisis une image.'),
	v.mimeType(acceptedImageTypes, 'Formats acceptés : JPEG, PNG, WebP ou AVIF.'),
	v.maxSize(MAX_IMAGE_BYTES, 'Cette image dépasse 8 Mo.')
);

export const avatarSchema = v.object({ photo: imageFileSchema });

export const reviewPhotosSchema = v.optional(
	v.pipe(
		v.array(imageFileSchema),
		v.maxLength(MAX_REVIEW_PHOTOS, `Trois photos maximum par avis.`)
	),
	[]
);
