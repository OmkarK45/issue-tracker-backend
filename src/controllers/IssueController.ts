import { Router } from 'express'
import { prisma } from '../config/db'
import { ExpressRequest } from '../config/express'
import { requireAuth } from '../middlewares/AuthMiddleware'
import { HttpStatus } from '../utils/statusCodes'

const router = Router()
// create an issue

router.post('/new', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { description, title, priority, type, status, application_id } =
		req.body

	try {
		const newIssue = await prisma.issue.create({
			data: {
				description,
				title,
				priority,
				type,
				status,
				application: {
					connect: {
						id: application_id,
					},
				},
				createdBy: {
					connect: {
						id: user?.id,
					},
				},
			},
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				issue: {
					connect: { id: newIssue.id },
				},
				author: {
					connect: { id: user?.id },
				},
				text: `${user?.name} created issue`,
				type: 'CREATED',
			},
		})

		return res.json({
			success: true,
			data: {
				newIssue,
				issueActivity,
			},
		})
	} catch (e) {
		return res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Failed to create issue.',
		})
	}
})

// Update an issue
router.post('/:id/update', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { description, title, priority, type, status } = req.body

	try {
		const updatedIssue = await prisma.issue.update({
			where: {
				id: req.params.id,
			},
			data: {
				description,
				title,
				priority,
				type,
				status,
			},
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				issue: {
					connect: { id: updatedIssue.id },
				},
				text: status
					? `${user?.name} updated issue status to ${status}`
					: priority
					? `${user?.name} updated issue priority to ${priority}`
					: type
					? `${user?.name} updated issue type to ${type}`
					: description
					? `${user?.name} updated issue description to ${description}`
					: `${user?.name} updated issue title to ${title}`,
				type: 'UPDATED',
				author: {
					connect: { id: user?.id },
				},
			},
		})

		return res.json({
			success: true,
			data: {
				updatedIssue,
				issueActivity,
			},
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to update issue.',
		})
	}
})

//  assign issue to list of users
router.post('/:id/assign', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { users } = req.body as { users: string[] }

	try {
		const updatedIssue = await prisma.issue.update({
			where: {
				id: req.params.id,
			},
			data: {
				assigned_to: {
					connect: users.map((user) => ({ id: user })),
				},
			},
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				issue: {
					connect: { id: updatedIssue.id },
				},
				text: `${user?.name} assigned issue to ${users.length} users`,
				type: 'ASSIGNED',
				author: {
					connect: { id: user?.id },
				},
			},
		})

		return res.json({
			success: true,
			data: {
				updatedIssue,
				issueActivity,
			},
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to assign issue.',
		})
	}
})

// Get all issues
router.get(
	'/:application_id/issues',
	requireAuth,
	async (req: ExpressRequest, res) => {
		try {
			const issues = await prisma.issue.findMany({
				where: {
					applicationId: req.params.application_id,
				},
				orderBy: {
					createdAt: 'desc',
				},
			})

			return res.json({
				success: true,
				data: issues,
			})
		} catch (e) {
			return res.json({
				success: false,
				error: 'Failed to get issues.',
			})
		}
	}
)

// delete an issue
router.post('/:id/delete', requireAuth, async (req: ExpressRequest, res) => {
	try {
		await prisma.issue.delete({
			where: {
				id: req.params.id,
			},
		})

		return res.json({
			success: true,
			data: 'Issue has been deleted.',
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to delete issue.',
		})
	}
})

// get a particular issue
router.get('/:id', requireAuth, async (req: ExpressRequest, res) => {
	try {
		const issue = await prisma.issue.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				assigned_to: {
					select: {
						user: {
							select: {
								name: true,
								email: true,
							},
						},
					},
				},
				comments: true,
				createdBy: true,
				_count: {
					select: {
						comments: true,
						assigned_to: true,
					},
				},
			},
		})

		return res.json({
			success: true,
			data: issue,
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to get issue.',
		})
	}
})

// search issue
router.get(
	'/search/:keyword',
	requireAuth,
	async (req: ExpressRequest, res) => {
		try {
			const issues = await prisma.issue.findMany({
				where: {
					title: {
						contains: req.params.keyword,
					},
				},
				include: {
					assigned_to: {
						select: {
							user: {
								select: {
									name: true,
									email: true,
								},
							},
						},
					},
					comments: true,
					createdBy: true,
				},
			})

			return res.json({
				success: true,
				data: issues,
			})
		} catch (e) {
			return res.json({
				success: false,
				error: 'Failed to search issue.',
			})
		}
	}
)

// my issues
router.get(
	'/:application_id/issues/mine',
	requireAuth,
	async (req: ExpressRequest, res) => {
		try {
			const issues = await prisma.issue.findMany({
				where: {
					applicationId: req.params.application_id,
					assigned_to: {
						some: {
							userId: req?.user?.id,
						},
					},
				},
				include: {
					assigned_to: {
						select: {
							user: {
								select: {
									name: true,
									email: true,
								},
							},
						},
					},
					comments: true,
					createdBy: true,
				},
			})

			return res.json({
				success: true,
				data: issues,
			})
		} catch (e) {
			return res.json({
				success: false,
				error: 'Failed to get my issues.',
			})
		}
	}
)

// list of closed issues in an application
router.get(
	'/:application_id/issues/closed',
	requireAuth,
	async (req: ExpressRequest, res) => {
		try {
			const issues = await prisma.issue.findMany({
				where: {
					applicationId: req.params.application_id,
					status: 'CLOSED',
				},
				include: {
					assigned_to: {
						select: {
							user: {
								select: {
									name: true,
									email: true,
								},
							},
						},
					},
					comments: true,
					createdBy: true,
				},
			})

			return res.json({
				success: true,
				data: issues,
			})
		} catch (e) {
			return res.json({
				success: false,
				error: 'Failed to get closed issues.',
			})
		}
	}
)

// get activity of an issue
router.get('/:id/activity', requireAuth, async (req: ExpressRequest, res) => {
	try {
		const activity = await prisma.issue.findUnique({
			where: {
				id: req.params.id,
			},
			include: {
				comments: true,
				assigned_to: true,
				createdBy: true,
			},
		})

		return res.json({
			success: true,
			data: activity,
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to get activity.',
		})
	}
})
