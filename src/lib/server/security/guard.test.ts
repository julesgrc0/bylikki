import { describe, expect, test, vi } from 'vitest';
import type { SessionUser } from './guard';

let currentUser: SessionUser | null = null;

vi.mock('$app/server', () => ({
	getRequestEvent: () => ({ locals: { user: currentUser } })
}));

const { getSessionUser, requireAdmin, requireUser } = await import('./guard');

const cliente: SessionUser = {
	id: 'utilisateur-1',
	email: 'emma@exemple.fr',
	role: 'USER',
	displayName: null
};
const administratrice: SessionUser = { ...cliente, id: 'utilisateur-2', role: 'ADMIN' };

function statusOf(action: () => unknown) {
	try {
		action();
	} catch (thrown) {
		return (thrown as { status?: number }).status;
	}

	return null;
}

describe('gardes de session', () => {
	test('sans session, aucune identite n est exposee', () => {
		currentUser = null;

		expect(getSessionUser()).toBeNull();
	});

	test('requireUser refuse une requete anonyme avec un 401', () => {
		currentUser = null;

		expect(statusOf(requireUser)).toBe(401);
	});

	test('requireUser laisse passer une cliente connectee', () => {
		currentUser = cliente;

		expect(requireUser()).toEqual(cliente);
	});

	test('requireAdmin refuse une cliente avec un 403', () => {
		currentUser = cliente;

		expect(statusOf(requireAdmin)).toBe(403);
	});

	test('requireAdmin refuse une requete anonyme avec un 401', () => {
		currentUser = null;

		expect(statusOf(requireAdmin)).toBe(401);
	});

	test('requireAdmin laisse passer un compte administrateur', () => {
		currentUser = administratrice;

		expect(requireAdmin()).toEqual(administratrice);
	});
});
