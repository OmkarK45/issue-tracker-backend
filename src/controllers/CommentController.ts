import { Router } from 'express'
import { prisma } from '../config/db'
import { ExpressRequest } from '../config/express'
import { requireAuth } from '../middlewares/AuthMiddleware'
import { HttpStatus } from '../utils/statusCodes'

const router = Router()

// post comment on a issue
router.post('/:id/comment', requireAuth, async (req: ExpressRequest, res) => {
	const user = req.user
	const { text } = req.body
	const { id } = req.params
	try {
		const newComment = await prisma.comment.create({
			data: {
				text,
				issue: { connect: { id } },
				author: { connect: { id: user?.id } },
			},
			include: { author: { select: { username: true } } },
		})

		const issueActivity = await prisma.issueActivity.create({
			data: {
				type: 'COMMENTED',
				issue: { connect: { id: newComment.issueId } },
				author: {
					connect: { id: newComment.authorId },
				},
				text: `${newComment.author.username} commented on issue : ${text}`,
			},
		})

		return res.json({
			success: true,
			data: newComment,
		})
	} catch (e) {
		return res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Failed to create comment.',
		})
	}
})

//  get all comments on an issue
router.get('/:id/comments', requireAuth, async (req: ExpressRequest, res) => {
	const { id } = req.params
	try {
		const comments = await prisma.comment.findMany({
			where: {
				issue: { id },
			},
		})

		return res.json({
			success: true,
			data: comments,
		})
	} catch (e) {
		return res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Failed to get comments.',
		})
	}
})

// delete comment on an issue
router.delete(
	'/:id/comment/delete',
	requireAuth,
	async (req: ExpressRequest, res) => {
		const { id } = req.params

		try {
			const commentFound = await prisma.comment.findUnique({
				where: { id },
			})

			if (commentFound?.authorId !== req.user?.id) {
				return res.json({
					success: false,
					code: HttpStatus.UNAUTHORIZED,
					message: 'You are not authorized to delete this comment.',
				})
			}

			const comment = await prisma.comment.delete({
				where: { id },
			})

			return res.json({
				success: true,
				data: 'Your comment was deleted.',
			})
		} catch (e) {
			return res.json({
				success: false,
				code: HttpStatus.INTERNAL_SERVER_ERROR,
				message: 'Failed to delete comment.',
			})
		}
	}
)

// update a comment
router.post('/:id/edit', requireAuth, async (req: ExpressRequest, res) => {
	const { id } = req.params
	const { text } = req.body
	try {
		const commentFound = await prisma.comment.findUnique({
			where: { id },
		})

		if (commentFound?.authorId !== req.user?.id) {
			return res.json({
				success: false,
				code: HttpStatus.UNAUTHORIZED,
				message: 'You are not authorized to edit this comment.',
			})
		}

		const comment = await prisma.comment.update({
			where: { id },
			data: { text },
			include: {
				author: { select: { username: true } },
			},
		})

		return res.json({
			success: true,
			data: { comment },
		})
	} catch (e) {
		return res.json({
			success: false,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Failed to edit comment.',
		})
	}
})

export { router as CommentController }
