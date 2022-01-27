import { nanoid } from 'nanoid'

export const generateSlugFromName = (
	name: string,
	suffix: string = '',
	includeUUID: boolean = false
) => {
	const cleanedName = name
		.toString()
		.toLowerCase()
		.trim()
		.replace(/&/g, '-and-')
		.replace(/[\s\W-]+/g, '-')
		.replace(/-$/, '')

	const cleanedSuffix = suffix
		.toString()
		.toLowerCase()
		.trim()
		.replace(/&/g, '-and-')
		.replace(/[\s\W-]+/g, '-')
		.replace(/-$/, '')

	return `${cleanedName}${cleanedSuffix && '-' + cleanedSuffix}${
		includeUUID ? '-' + nanoid(6) : ''
	}`
}
