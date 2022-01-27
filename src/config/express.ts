import { Request, Response } from 'express'
import { User } from '@prisma/client'
import {
	CartStatus,
	HttpStatus,
	ProductStatus,
	ReviewStatus,
	WishlistStatus,
} from '../utils/statusCodes'

export interface ExpressRequest extends Request {
	user?: Omit<User, 'hashedPassword'>
	currentUser?: Omit<User, 'hashedPassword'>
}

export interface ExpressContext {
	req: ExpressRequest
	res: Response
}

// TODO: refine these types
interface Json {
	success: boolean
	data?: any
	pageInfo?: any
	code:
		| keyof typeof HttpStatus
		| keyof typeof CartStatus
		| keyof typeof ProductStatus
		| keyof typeof WishlistStatus
		| keyof typeof ReviewStatus
}

type Send<T = Response> = (body?: Json) => T

export interface CustomResponse extends Response {
	json: Send<this>
}
