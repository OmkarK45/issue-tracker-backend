import { prisma } from '../src/config/db'
import { hashPassword } from '../src/utils/password'
import { data } from './scrapper/masterData'
import _ from 'lodash'
import fs from 'fs'
import { MovieType } from '@prisma/client'

const userData = [...Array(5).keys()].slice(1)

async function seedUsers() {
	for (const [u, i] of userData.entries()) {
		const user = await prisma.user.create({
			data: {
				email: `root_user${i + 1}@gmail.com`,
				name: `root_user${i}`,
				hashedPassword: await hashPassword('root_user'),
			},
		})
		console.log(`👽 Created user with id: ${user.id}`)
	}
}

async function seedMoviesFromJson() {
	// remove thise which dont have video_id
	const data1 = data.filter((movie) => movie.video_id)

	const movies = _.map(data1, (movie) => {
		return {
			...movie,
			genre: movie.genre.map((genre) => {
				if (genre === 'Sci-Fi') {
					return 'SCI_FI' as MovieType
				}
				return genre.toUpperCase() as MovieType
			}),
		}
	})
	// @ts-ignore - it exists
	await prisma.video.createMany({ data: movies, skipDuplicates: true })
}

async function main() {
	console.log(`---🌿 STARTED SEEDING 🌿--- `)
	seedMoviesFromJson()
	console.log(`---🌿 FINISHED SEEDING 🌿--- `)
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
