import jwt from 'jsonwebtoken'

export type Payload = Record<string, unknown>

/**
 * Create a JWT token with the given payload and options.
 * @param {Payload} payload - Payload - The payload to be signed.
 * @param options - jwt.SignOptions
 * @returns A string containing the token.
 */
export function createToken(
	payload: Payload,
	options?: jwt.SignOptions
): string {
	try {
		const token = jwt.sign(payload, 'mysecret', {
			issuer: '@dogecorp/api',
			audience: ['@dogecorp/client'],
			expiresIn: '7d',
			...options,
		})
		return token
	} catch (error) {
		throw error
	}
}

/**
 * Verify a JWT token and return the payload.
 * @param {string} token - string - The token to be decrypted.
 * @returns The decoded token.
 */
export function decryptToken<T>(token: string): T {
	try {
		const isVerified = jwt.verify(token, 'mysecret')

		if (!isVerified) throw new Error('Token has been malformed.')

		const payload = jwt.decode(token)
		return payload as T
	} catch (error) {
		throw error
	}
}
