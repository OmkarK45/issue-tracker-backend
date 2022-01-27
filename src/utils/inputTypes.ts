import { MovieType } from '@prisma/client'
import { z } from 'zod'

export const AddMovieInput = z.object({
	title: z.string(),
	description: z.string(),
	poster_url: z.string(),
	movie_type: z.string(),
	duration: z.number(),
	video_id: z.string(),
	rating: z.number(),
	year: z.number(),
	imdb_id: z.string(),
	release: z.string(),
})
