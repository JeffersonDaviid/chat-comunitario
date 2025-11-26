import { Router, Request, Response, NextFunction } from 'express'
import schemaValidator from '../middlewares/data.validation'
import { RegisterUserSchema, LoginSchema } from '../../model/schemas/user'
import { registerCtrl } from '../register-ctrl'
import { loginCtrl } from '../login-ctrl'
import { dbCommunities } from '../../model/services/DBSIMULATE'
import multer, { FileFilterCallback } from 'multer'

const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
		if (file.mimetype === 'image/jpeg') return cb(null, true)
		cb(new Error('Solo se permite imagen JPG'))
	},
	limits: { fileSize: 2 * 1024 * 1024 },
})

export const authRoute = Router()

// Orden: subir archivo -> mover buffer a body.profile -> validar schema -> controlador
authRoute.post(
	'/register',
	upload.single('profile'),
	(req: Request, _res: Response, next: NextFunction) => {
		if (req.file?.buffer) {
			// Adjuntar Buffer al body para cumplir z.instanceof(Buffer)
			;(req.body as any).profile = req.file.buffer
		}
		// Convertir latitude y longitude a números
		if (req.body.latitude) req.body.latitude = parseFloat(req.body.latitude)
		if (req.body.longitude) req.body.longitude = parseFloat(req.body.longitude)
		next()
	},
	schemaValidator(RegisterUserSchema),
	registerCtrl
)

authRoute.post('/login', schemaValidator(LoginSchema), loginCtrl)

// Comunidades del usuario
authRoute.get('/communities/:cedula', (req, res) => {
	const { cedula } = req.params
	if (!cedula) return res.status(400).json({ message: 'Falta cédula' })

	const communities = dbCommunities
		.filter((c) => c.members.some((m) => m.cedula === cedula))
		.map((c) => ({
			id: c.id,
			title: c.title,
			description: c.description,
			channels: (c.channels || []).map((ch) => ({
				id: ch.id,
				name: ch.name,
				description: ch.description,
			})),
		}))

	res.json({ communities })
})

// Mensajes de un canal
authRoute.get('/communities/:communityId/channels/:channelId/messages', (req, res) => {
	const { communityId, channelId } = req.params
	const comm = dbCommunities.find((c) => c.id === communityId)
	if (!comm) return res.status(404).json({ message: 'Comunidad no encontrada' })
	const chan = (comm.channels || []).find((ch) => ch.id === channelId)
	if (!chan) return res.status(404).json({ message: 'Canal no encontrado' })

	const messages = (chan.messages || []).map((m) => ({
		id: m.id,
		senderId: m.owner?.cedula,
		sender: m.owner
			? { 
				cedula: m.owner.cedula, 
				username: `${m.owner.name} ${m.owner.lastName}`,
				name: m.owner.name, 
				lastName: m.owner.lastName,
				avatar: m.owner.profileImg
			}
			: undefined,
		content: m.content,
		text: m.content,
		timestamp: m.timestamp,
	}))

	res.json({ messages })
})
