/**
 * Une remote function qui echoue rejette avec `{ status, body: { message } }`,
 * et non avec une `Error` : sans cette lecture, le message ecrit cote serveur
 * n'atteindrait jamais la personne.
 */
export function toMessage(error: unknown, fallback: string) {
	if (error && typeof error === 'object' && 'body' in error) {
		const body = (error as { body?: { message?: unknown } }).body;

		if (body && typeof body.message === 'string' && body.message !== '') {
			return body.message;
		}
	}

	if (error instanceof Error && error.message !== '') {
		return error.message;
	}

	return fallback;
}
