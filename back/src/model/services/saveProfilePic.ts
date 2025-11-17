import fs from 'fs'
import path from 'path'

/**
 * Guarda el buffer de la foto de perfil como JPG con nombre <cedula>.jpg
 * en la ruta back/src/assets/profiles/
 *
 * Retorna la ruta pública relativa usada en el proyecto: /src/assets/profiles/<cedula>.jpg
 */
export async function saveProfilePic(cedula: string, buffer: Buffer): Promise<string> {
	const dir = path.join(process.cwd(), 'src', 'assets', 'profiles')
	const fileName = `${cedula}.jpg`
	const absPath = path.join(dir, fileName)

	await fs.promises.mkdir(dir, { recursive: true })
	await fs.promises.writeFile(absPath, buffer)

	// Ruta relativa que se viene usando en los datos simulados
	return `/src/assets/profiles/${fileName}`
}

export default saveProfilePic
