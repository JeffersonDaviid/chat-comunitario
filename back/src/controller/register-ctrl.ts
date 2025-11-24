import { Request, Response } from 'express'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response-http'
import { User } from '../model/schemas/db'
import { saveProfilePic } from '../model/services/saveProfilePic'
import { dbUsers } from '../model/services/DBSIMULATE'
import bcrypt from 'bcryptjs'

const registerCtrl = async (req: Request, res: Response) => {
	try {
		const data = req.body

		const profileBuffer: Buffer | undefined =
			data.profile instanceof Buffer ? data.profile : undefined
		
		// Validación de confirmPassword coherente (ya validado formato con zod)
		if (data.password !== data.confirmPassword) {
			return sendErrorResponse(res, 400, 'Las contraseñas no coinciden')
		}

		// Verificar si el usuario ya existe
		const existingUser = dbUsers.find(u => u.cedula === data.cedula || u.email === data.email)
		if (existingUser) {
			return sendErrorResponse(res, 400, 'Ya existe un usuario con esa cédula o email')
		}

		// Hashear la contraseña
		const hashedPassword = await bcrypt.hash(data.password, 10)

		let profileImgPath = ''
		if (profileBuffer) {
			try {
				profileImgPath = await saveProfilePic(data.cedula, profileBuffer)
			} catch (e) {
				return sendErrorResponse(res, 400, 'No se pudo guardar la imagen de perfil', e)
			}
		}

		const newUser: User = {
			cedula: data.cedula,
			name: data.name,
			lastName: data.lastName,
			email: data.email,
			password: hashedPassword,
			phone: data.phone,
			address: data.address,
			latitude: data.latitude,
			longitude: data.longitude,
			profileImg: profileImgPath,
		}

		// Guardar el usuario en la base de datos
		dbUsers.push(newUser)

		// No devolver la contraseña en la respuesta
		const { password, ...userWithoutPassword } = newUser

		sendSuccessResponse(res, 201, 'Usuario registrado con éxito', { user: userWithoutPassword })
	} catch (error) {
		sendErrorResponse(res, 400, 'Ocurrió un error al registrar', error)
	}
}

export { registerCtrl }
