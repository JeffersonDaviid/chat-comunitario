import { Request, Response } from 'express'
import { sendErrorResponse, sendSuccessResponse } from '../utils/response-http'
import { dbUsers } from '../model/services/DBSIMULATE'

export const loginCtrl = (req: Request, res: Response) => {
	try {
		const { email, password } = req.body as { email: string; password: string }

		const found = dbUsers.find((u) => u.email === email && u.password === password)
		if (!found) {
			return sendErrorResponse(res, 401, 'Credenciales inválidas')
		}

		const { password: _pwd, ...safeUser } = found as any

		const token = `fake-token-${safeUser.cedula}`

		return sendSuccessResponse(res, 200, 'Login exitoso', {
			token,
			user: safeUser,
		})
	} catch (error) {
		return sendErrorResponse(res, 400, 'Ocurrió un error al iniciar sesión', error)
	}
}

export default loginCtrl
