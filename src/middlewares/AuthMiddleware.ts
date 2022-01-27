import { User } from '@prisma/client'
import { RequestHandler } from 'express'
import { ExpressRequest } from '../config/express'
import { decryptToken } from '../config/jwt'
import jwt from 'jsonwebtoken'

export const requireAuth: RequestHandler = async (
	req: ExpressRequest,
	res,
	next
) => {
	const token = req.cookies['token']

	if (!token) {
		return res.status(401).json({
			msg: 'You are unauthorized to access this resource.',
			error_code: 'ERROR_UNAUTHORIZED',
		})
	}

	jwt.verify(token, 'mysecret', (err: any, decoded: any) => {
		console.log(decoded)
		if (err) {
			return res.status(401).json({
				msg: 'You are unauthorized to access this resource.',
				error_code: 'ERROR_UNAUTHORIZED',
			})
		}
		return
	})

	const user = decryptToken<User>(token)

	if (!user) {
		return res.status(401).json({
			msg: 'You are unauthorized to access this resource.',
			error_code: 'ERROR_UNAUTHORIZED',
		})
	}

	req.user = user

	next()
}
