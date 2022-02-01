import { Router } from 'express'
import { prisma } from '../config/db'
import { ExpressRequest } from '../config/express'
import { requireAuth } from '../middlewares/AuthMiddleware'
import {
	generatePaginationResult,
	getPaginationArgs,
} from '../utils/prismaPaginationArgs'

const router = Router()

// Create an application
router.post('/new', requireAuth, async (req: ExpressRequest, res) => {
	const { name, description, website, logo } = req.body

	try {
		const application = await prisma.application.create({
			data: {
				name,
				description,
				website,
				logo,
				createdBy: {
					connect: {
						email: req?.user?.email,
					},
				},
			},
		})

		return res.json({
			success: true,
			data: application,
			message: 'Your application has been created successfully',
		})
	} catch (e) {
		console.log('ERROR', e)
		return res.json({
			success: false,
			error: e,
			message: 'Failed to create application.',
		})
	}
})

// Get all applications
router.get('/', requireAuth, async (req: ExpressRequest, res) => {
	const args = getPaginationArgs(req)
	try {
		const totalCount = await prisma.application.count({
			where: { createdById: req?.user?.id },
		})

		const applications = await prisma.application.findMany({
			where: {
				createdById: req?.user?.id,
			},
			take: args.limit,
			skip: args.startIndex,
		})

		const pageInfo = generatePaginationResult({
			...args,
			totalCount,
		})

		return res.json({
			success: true,
			data: applications,
			pageInfo,
		})
	} catch (e) {
		return res.json({
			success: false,
			error: e,
			message: 'Failed to get applications.',
		})
	}
})

// Get an application
router.get('/:id', requireAuth, async (req: ExpressRequest, res) => {
	const { id } = req.params
	const args = getPaginationArgs(req)

	try {
		const application = await prisma.application.findUnique({
			where: { id },
			include: {
				members: {
					select: {
						name: true,
						id: true,
						username: true,
						email: true,
					},
				},
				createdBy: {
					select: { name: true },
				},
				_count: {
					select: {
						issues: true,
						members: true,
					},
				},
			},
		})

		return res.json({
			success: true,
			data: application,
		})
	} catch (e) {
		return res.json({
			success: false,
			error: e,
			message: 'Failed to get application.',
		})
	}
})

// delete an organization if created by the user
router.post('/:id/delete', requireAuth, async (req: ExpressRequest, res) => {
	const { id } = req.params

	try {
		const application = await prisma.application.findUnique({
			where: { id },
		})

		if (!application) {
			return res.json({
				success: false,
				error: 'Application not found',
				message: 'Failed to delete application.',
			})
		}

		if (application.createdById !== req?.user?.id) {
			return res.json({
				success: false,
				error: 'You are not authorized to delete this application',
				message: 'Failed to delete application.',
			})
		}

		await prisma.application.delete({
			where: { id },
		})

		return res.json({
			success: true,
			message: 'Application deleted successfully',
		})
	} catch (e) {
		console.log(e)
		return res.json({
			success: false,
			error: e,
			message: 'Failed to delete application.',
		})
	}
})

// add a user to org as a member if they have account
router.post('/:id/add-user', requireAuth, async (req: ExpressRequest, res) => {
	const { id } = req.params
	const { email } = req.body

	try {
		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			return res.json({
				success: false,
				error: 'User not found',
				message:
					'Requested user does not have account on SimpleIssue. Please create an account.',
			})
		}

		const application = await prisma.application.findUnique({
			where: { id },
		})

		if (!application) {
			return res.json({
				success: false,
				error: 'Application not found',
				message: 'Failed to add user to application.',
			})
		}
		console.log('IDS ', application.createdById, req?.user?.id)
		if (application.createdById !== req?.user?.id) {
			return res.json({
				success: false,
				error: 'You are not authorized to add a user to this application',
				message: 'Failed to add user to application.',
			})
		}

		await prisma.application.update({
			where: { id },
			data: {
				members: {
					connect: { email },
				},
			},
		})

		return res.json({
			success: true,
			message: 'User added to application successfully',
		})
	} catch (e) {
		return res.json({
			success: false,
			error: e,
			message: 'Failed to add user to application.',
		})
	}
})

// remove member from application if they are a member
router.post(
	'/:id/remove-user',
	requireAuth,
	async (req: ExpressRequest, res) => {
		const { id } = req.params
		const { email } = req.body

		try {
			const application = await prisma.application.findUnique({
				where: { id },
			})

			if (!application) {
				return res.json({
					success: false,
					error: 'Application not found',
					message: 'Failed to remove user from application.',
				})
			}

			if (application.createdById !== req?.user?.id) {
				return res.json({
					success: false,
					error:
						'You are not authorized to remove a user from this application',
					message: 'Failed to remove user from application.',
				})
			}

			await prisma.application.update({
				where: { id },
				data: {
					members: {
						disconnect: { email },
					},
				},
			})

			return res.json({
				success: true,
				message: 'User removed from application successfully',
			})
		} catch (e) {
			return res.json({
				success: false,
				error: e,
				message: 'Failed to remove user from application.',
			})
		}
	}
)

export { router as OrganizationController }
