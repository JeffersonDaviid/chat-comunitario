import fs from 'fs'
import path from 'path'


export async function saveProfilePic(cedula: string, buffer: Buffer): Promise<string> {
	const dir = path.join(process.cwd(), 'src', 'assets', 'profiles')
	const fileName = `${cedula}.jpg`
	const absPath = path.join(dir, fileName)

	await fs.promises.mkdir(dir, { recursive: true })
	await fs.promises.writeFile(absPath, buffer)

	return `/src/assets/profiles/${fileName}`
}

export default saveProfilePic
