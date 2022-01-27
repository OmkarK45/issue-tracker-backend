import { PrismaClient } from '@prisma/client'
/**
 * This is the code that connects to the database.
 *
 * Create a new file called `index.js` and copy the following code into it.
 * /* TypeScript */

export const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] })
