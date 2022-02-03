import { StatusType } from '@prisma/client'
import e, { Router } from 'express'
import { prisma } from '../config/db'
import { ExpressRequest } from '../config/express'
import { requireAuth } from '../middlewares/AuthMiddleware'
import {
	generatePaginationResult,
	getPaginationArgs,
} from '../utils/prismaPaginationArgs'
import { HttpStatus } from '../utils/statusCodes'

const router = Router()
// create an issue

router.post('/new', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { description, title, priority, type, status, application_id } =
		req.body

	try {
		const totalIssues = await prisma.issue.count({
			where: {
				applicationId: application_id,
			},
		})
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
				number: totalIssues + 1,
			},
			include: { application: { select: { name: true } } },
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
		console.log(e)
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
			include: {
				createdBy: {
					select: { name: true, email: true, id: true },
				},
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
					? `${user?.name} updated issue description.`
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
	const { assignedUserIds } = req.body as { assignedUserIds: string[] }

	try {
		const issue = await prisma.issue.findUnique({
			where: { id: req.params.id },
			include: {
				assigned_to: { select: { user: { select: { id: true } } } },
			},
		})

		// check if already assigned and filter assignedUserIds
		const assignedUserIdsToAssign = assignedUserIds.filter(
			(userId) =>
				!issue?.assigned_to.some(
					(assignedUser) => assignedUser.user.id === userId
				)
		)
		console.log('LIST OF IDS RECIVED', assignedUserIds)
		console.log('LIST OF IDS TO ASSIGN', assignedUserIdsToAssign)
		const updatedIssue = await prisma.issue.update({
			where: {
				id: req.params.id,
			},
			data: {
				assigned_to: {
					create: assignedUserIdsToAssign.map((id) => ({
						user: {
							connect: {
								id,
							},
						},
					})),
				},
			},
			include: {
				assigned_to: {
					select: { user: { select: { name: true, id: true, email: true } } },
				},
			},
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				issue: {
					connect: { id: updatedIssue.id },
				},
				text: `${user?.name} assigned issue to ${updatedIssue.assigned_to
					.map((user) => user.user.name)
					.join(', ')}`,
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
		console.log(e)
		return res.json({
			success: false,
			error: 'Failed to assign issue.',
		})
	}
})
// unassign an issue
router.post('/:id/unassign', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { assignedUserId } = req.body as { assignedUserId: string }

	try {
		console.log('>>>>>>>>>', assignedUserId)
		const unAssignedUser = await prisma.user.findUnique({
			where: {
				id: assignedUserId,
			},
			include: {
				assigned_issues: {
					select: { id: true },
				},
			},
		})
		console.log('UN ASSIGNWED USER', unAssignedUser)

		const issue = await prisma.issue.findUnique({
			where: { id: req.params.id },
		})

		console.log(
			unAssignedUser?.assigned_issues.find(
				(issue) => issue.id === req.params.id
			)
		)

		await prisma.issuesOnUser.delete({
			where: {
				userId_issueId: {
					userId: assignedUserId,
					issueId: req.params.id,
				},
			},
		})

		const updatedIssue = await prisma.issue.findUnique({
			where: { id: req.params.id },
			include: {
				assigned_to: {
					select: { user: { select: { name: true, id: true, email: true } } },
				},
			},
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				issue: {
					connect: { id: issue?.id },
				},
				text: `${user?.name} unassigned issue from ${unAssignedUser?.name}`,
				type: 'UNASSIGNED',
				author: {
					connect: { id: user?.id },
				},
			},
		})
		return res.json({
			success: true,
			data: { issueActivity, updatedIssue },
		})
	} catch (e) {
		console.log(e)
		return res.json({
			message: 'Failed to unassign issue.',
			success: false,
		})
	}
})

// Get all issues
router.get(
	'/:application_id/all',
	requireAuth,
	async (req: ExpressRequest, res) => {
		const args = getPaginationArgs(req)
		const status = req.query.status as StatusType

		try {
			const totalCount = await prisma.issue.count({
				where: {
					applicationId: req.params.application_id,
				},
			})

			const issues = await prisma.issue.findMany({
				where: {
					applicationId: req.params.application_id,
					status,
				},
				orderBy: {
					createdAt: 'desc',
				},
				include: { application: { select: { name: true } } },
				take: args.limit,
				skip: args.startIndex,
			})

			const pageInfo = generatePaginationResult({
				...args,
				totalCount,
			})

			return res.json({
				success: true,
				pageInfo,
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
				issueActivity: {
					orderBy: { createdAt: 'asc' },
				},
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
				createdBy: {
					select: {
						name: true,
						email: true,
						id: true,
					},
				},
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
		const args = getPaginationArgs(req)

		try {
			const totalCount = await prisma.issue.count({
				where: {
					applicationId: req.params.application_id,
					assigned_to: {
						some: {
							userId: req?.user?.id,
						},
					},
				},
			})

			const pageInfo = generatePaginationResult({
				...args,
				totalCount,
			})
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
					createdBy: {
						select: {
							name: true,
							email: true,
							id: true,
						},
					},
					application: { select: { name: true } },
				},
				take: args.limit,
				skip: args.startIndex,
			})

			return res.json({
				success: true,
				data: issues,
				pageInfo,
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
	const args = getPaginationArgs(req)

	try {
		const totalCount = await prisma.issue.count({
			where: { id: req.params.id },
		})

		const activity = await prisma.issue.findUnique({
			where: {
				id: req.params.id,
			},
			select: {
				issueActivity: {
					include: {
						author: { select: { name: true } },
					},
					orderBy: {
						createdAt: 'desc',
					},
					skip: args.startIndex,
					take: args.limit,
				},
			},
		})

		const pageInfo = generatePaginationResult({
			...args,
			totalCount,
		})

		return res.json({
			success: true,
			data: activity?.issueActivity,
			pageInfo,
		})
	} catch (e) {
		return res.json({
			success: false,
			error: 'Failed to get activity.',
		})
	}
})
export { router as IssueController }
