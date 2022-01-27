/**
 * What the hell is this ?
 * This is a small abstraction I wrote for offset pagination using page and per page query.
 */
interface PaginationInput {
	page: number
	limit: number
	last_page: string
	startIndex: number
	endIndex: number
	currentPage: number
	totalCount: number
}

/**
 *
 * @param req - Express Request Object
 * @returns - Parsed values from PaginationInput
 */
export function getPaginationArgs(req: any) {
	const query = req.query
	const page = parseInt(query.page as string) || 1
	const limit = parseInt(query.limit as string) || 10
	const last_page = req.query.last_page
	const startIndex = (page - 1) * limit
	const endIndex = page * limit
	const result = {} as any
	const currentPage = page || 0

	return {
		page,
		limit,
		last_page,
		startIndex,
		endIndex,
		result,
		currentPage,
	}
}

interface ResultShape {
	/** Total items in a prisma collection */
	totalCount: number
	totalPage: number
	currentPage: number
	next?: {
		page: number
		limit: number
	}
	previous?: {
		page: number
		limit: number
	}
	last?: {
		page: number
		limit: number
	}
}

/**
 *
 * @param paginationInput - returned from PaginationInput + total count
 * @returns - Page info
 */
export function generatePaginationResult({
	page,
	limit,
	last_page,
	startIndex,
	endIndex,
	currentPage,
	totalCount,
}: PaginationInput) {
	let result = {} as ResultShape
	const totalPage = Math.ceil(totalCount / limit)

	try {
		if (page < 0) {
			throw new Error('Page value should not be negative')
		} else if (page === 1 && !last_page) {
			result.totalCount = totalCount
			result.totalPage = totalPage
			result.currentPage = currentPage
			result.next = {
				page: page + 1,
				limit: limit,
			}

			return result
		} else if (endIndex < totalCount && !last_page) {
			result.totalCount = totalCount
			result.totalPage = totalPage
			result.currentPage = currentPage
			result.next = {
				page: page + 1,
				limit: limit,
			}
			return result
		} else if (startIndex > 0 && !last_page) {
			result.totalCount = totalCount
			result.totalPage = totalPage
			result.currentPage = currentPage
			result.previous = {
				page: page - 1,
				limit: limit,
			}

			return result
		} else if (last_page === 'true' && page === totalPage) {
			result.totalCount = totalCount
			result.totalPage = totalPage
			result.currentPage = totalPage
			result.last = {
				page: totalPage,
				limit: limit,
			}

			return result
		} else {
			throw new Error('Something went wrong')
		}
	} catch (err) {
		console.error('error', err)
		throw new Error('Something went wrong, catch block')
	}
}
