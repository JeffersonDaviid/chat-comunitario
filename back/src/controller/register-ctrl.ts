import { Request, Response } from 'express'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response-http'
import { User } from '../model/schemas/db'
import { saveProfilePic } from '../model/services/saveProfilePic'

const registerCtrl = async (req: Request, res: Response) => {
	try {
		const data = req.body

		const profileBuffer: Buffer | undefined =
			data.profile instanceof Buffer ? data.profile : undefined
		// Validación de confirmPassword coerente (ya validado formato con zod)
		if (data.password !== data.confirmPassword) {
			return sendErrorResponse(res, 400, 'Las contraseñas no coinciden')
		}

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
			password: data.password,
			address: data.address,
			profileImg: profileImgPath,
		}

		sendSuccessResponse(res, 201, 'Usuario registrado con éxito', { user: newUser })
	} catch (error) {
		sendErrorResponse(res, 400, 'Ocurrió un error al registrar', error)
	}
}

export { registerCtrl }
