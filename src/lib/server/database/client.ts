import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '$prisma/client';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

function createPrismaClient() {
	const connectionString = env.PRISMA_DATABASE_URL;

	if (!connectionString) {
		throw new Error('PRISMA_DATABASE_URL est absent : la base de donnees ne peut pas etre jointe.');
	}

	return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

/**
 * Client Prisma partage. En developpement le rechargement a chaud recree le module,
 * on memorise donc l'instance sur globalThis pour ne pas epuiser le pool de connexions.
 */
export const prisma: PrismaClient = globalForPrisma.prismaClient ?? createPrismaClient();

globalForPrisma.prismaClient = prisma;
