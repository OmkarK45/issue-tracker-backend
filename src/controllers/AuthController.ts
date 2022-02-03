import { User } from '@prisma/client'
import { Router } from 'express'

import { prisma } from '../config/db'
import { CustomResponse, ExpressRequest } from '../config/express'
import { createToken } from '../config/jwt'
import { requireAuth } from '../middlewares/AuthMiddleware'
import { hashPassword, verifyPassword } from '../utils/password'
import { HttpStatus } from '../utils/statusCodes'

const router = Router()

/**
 * 1. We first check if the user exists in the database. If not, we return a 404 error.
 * 2. We then check if the password provided is correct. If not, we return a 401 error.
 * 3. If the user exists and the password is correct, we create a session for the user and return a
200 status code along with the user's information and a token.
 */
router.post('/login', async (req, res: CustomResponse) => {
	const { email, password } = req.body
	console.log(email, password)
	try {
		const user = await prisma.user.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
		})
		if (!user) {
			return res.status(404).json({
				code: 'NOT_FOUND',
				success: true,
				data: {
					message: 'No user with that email address. Please signup instead.',
				},
			})
		}
		const correctPassword = await verifyPassword(user.hashedPassword, password)
		console.log(correctPassword)

		if (!correctPassword) {
			return res.status(401).json({
				code: 'UNAUTHORIZED',
				success: true,
				data: {
					message: 'Password provided is incorrect.',
				},
			})
		}

		const userInfo = {
			id: user.id,
			email: user.email,
			name: user.name,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			username: user.username,
		}

		req.session.user = userInfo

		const token = createToken({
			...userInfo,
		})

		res.status(200).json({
			code: 'SUCCESS',
			success: true,
			data: {
				message: 'Login successful',
				user: userInfo,
				token,
			},
		})
	} catch (e: any) {
		console.log(
			`[Error] : File - AuthController, Function : /signin [post]`,
			e.message
		)
		res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
		})
	}
})

router.post('/signup', async (req, res: CustomResponse) => {
	const { name, email, password, username } = req.body
	try {
		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [{ email }, { username }],
			},
		})

		if (existingUser) {
			return res.status(400).json({
				data: {
					message: 'User already exists',
				},
				success: true,
				code: 'CONFLICT',
			})
		}

		const savedUser = await prisma.user.create({
			data: {
				email,
				name,
				hashedPassword: await hashPassword(password),
				username,
			},
		})

		const userInfo = {
			id: savedUser.id,
			name: savedUser.name,
			email: savedUser.email,
			createdAt: savedUser.createdAt,
			updatedAt: savedUser.updatedAt,
			username: savedUser.username,
		}

		const token = createToken({
			...userInfo,
		})

		req.session.user = userInfo

		res.status(200).json({
			code: 'SUCCESS',
			success: true,
			data: {
				user: userInfo,
				token,
			},
		})
	} catch (e: any) {
		console.log(
			`[Error] : File - AuthController, Function : /signup [post]`,
			e.message
		)
		res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
		})
	}
})

/**
 * Get the user's information from the database.
 */
router.get(
	'/user-info',
	requireAuth,
	async (req: ExpressRequest, res: CustomResponse) => {
		try {
			const user = req.user
			const currentUser = await prisma.user.findUnique({
				where: { email: user?.email },
				select: {
					email: true,
					id: true,
					name: true,
					hashedPassword: false,
				},
				rejectOnNotFound: true,
			})
			res.json({
				code: 'SUCCESS',
				success: true,
				data: {
					user: currentUser,
				},
			})
		} catch (e: any) {
			console.log(
				`[Error] : File - AuthController, Function : /user-info [get]`,
				e.message
			)
			res.json({
				success: false,
				code: HttpStatus.INTERNAL_SERVER_ERROR,
			})
		}
	}
)

export { router as AuthController }
