import { Router } from 'express'
import { prisma } from '../config/db'
import { ExpressRequest } from '../config/express'
import {
	generatePaginationResult,
	getPaginationArgs,
} from '../utils/prismaPaginationArgs'

const router = Router()

// Create an application
router.post('/new', async (req: ExpressRequest, res) => {
	const { name, description, website, logo } = req.body

	try {
		const application = await prisma.application.create({
			data: {
				name,
				description,
				website,
				logo,
				createdBy: {
					connect: { id: req?.user?.id },
				},
			},
		})

		return res.json({
			success: true,
			data: application,
			message: 'Your application has been created successfully',
		})
	} catch (e) {
		return res.json({
			success: false,
			error: e,
			message: 'Failed to create application.',
		})
	}
})

// Get all applications
router.get('/', async (req: ExpressRequest, res) => {
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
router.get('/:id', async (req: ExpressRequest, res) => {
	const { id } = req.params
	const args = getPaginationArgs(req)

	try {
		const application = await prisma.application.findUnique({
			where: { id },
			include: {
				issues: true,
				members: true,
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
router.post('/:id/delete', async (req: ExpressRequest, res) => {
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
		return res.json({
			success: false,
			error: e,
			message: 'Failed to delete application.',
		})
	}
})

// add a user to org as a member if they have account
router.post('/:id/add-user', async (req: ExpressRequest, res) => {
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
				message: 'Failed to add user to application.',
			})
		}

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
router.post('/:id/remove-user', async (req: ExpressRequest, res) => {
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
				error: 'You are not authorized to remove a user from this application',
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
})
