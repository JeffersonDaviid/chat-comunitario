import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'path'
import { WebSocketServer, WebSocket } from 'ws'
import { authRoute } from './controller/routes/auth-route'
import { communityRoute } from './controller/routes/community-route'
import { channelRoute } from './controller/routes/channel-route'
import { dbCommunities, dbUsers, initializeDatabaseWithPersistence, saveChanges } from './model/services/DBSIMULATE'
import { generateUUID } from './utils/static'

const { PORT = 3000 } = process.env

// ====== INICIALIZAR PERSISTENCIA ======
initializeDatabaseWithPersistence()
// ====================================

const app = express()
app.use(cors())

// MIDDLEWARES
app.use(express.json())
app.use(morgan('dev'))
// Servir archivos estáticos para perfiles
app.use('/src/assets', express.static(path.join(process.cwd(), 'src', 'assets')))
app.use('/assets', express.static(path.join(process.cwd(), 'src', 'assets')))

// HOME
app.get('/', (_req, res) => {
	res.send('<h2>Bienvenido a CHAT COMUNITARIO</h2>')
})

// API
app.use('/api/auth', authRoute)
app.use('/api/community', communityRoute)
app.use('/api/channel', channelRoute)

// Start HTTP server (Express)
const server = app.listen(PORT, () => {
	console.log(`Servidor HTTP (Express) iniciado en el puerto ${PORT}`)
})

// Mapa para agrupar sockets por comunidad y canal
// Estructura: communityId -> (channelId -> Set<WebSocket>)
const channelSockets: Map<string, Map<string, Set<WebSocket>>> = new Map()

// Attach WebSocket server (ws) on the same HTTP server
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (socket, req) => {
	console.log(`WS: nueva conexión desde ${req.socket.remoteAddress}`)

	// Parsear query params: ?communityId=...&cedula=...&channelId=...
	const url = new URL(req.url || '/ws', 'http://localhost')
	const communityId = url.searchParams.get('communityId')
	const cedula = url.searchParams.get('cedula')
	const channelIdFromConn = url.searchParams.get('channelId')

	if (!communityId || !cedula || !channelIdFromConn) {
		socket.send(
			JSON.stringify({
				type: 'error',
				message: 'Faltan parámetros communityId, cedula o channelId',
			})
		)
		socket.close()
		return
	}

	const community = dbCommunities.find((c) => c.id === communityId)
	if (!community) {
		socket.send(JSON.stringify({ type: 'error', message: 'Comunidad no encontrada' }))
		socket.close()
		return
	}

	const isMember = community.members.some((m) => m.cedula === cedula)
	if (!isMember) {
		socket.send(
			JSON.stringify({ type: 'error', message: 'Usuario no es miembro de la comunidad' })
		)
		socket.close()
		return
	}

	// Validar canal
	const channelExists = (community.channels || []).some(
		(ch) => ch.id === channelIdFromConn
	)
	if (!channelExists) {
		socket.send(
			JSON.stringify({ type: 'error', message: 'Canal no encontrado en la comunidad' })
		)
		socket.close()
		return
	}

	// Registrar socket en el grupo del canal dentro de la comunidad
	const chanMap = channelSockets.get(communityId) || new Map<string, Set<WebSocket>>()
	const set = chanMap.get(channelIdFromConn) || new Set<WebSocket>()
	set.add(socket)
	chanMap.set(channelIdFromConn, set)
	channelSockets.set(communityId, chanMap)

	// Obtener nombre del canal desde la estructura de datos (no crear variables innecesarias)
	const channelName = community.channels?.find((ch) => ch.id === channelIdFromConn)?.name || 'Canal'

	// Enviar mensaje de bienvenida con nombres de comunidad y canal
	socket.send(
		JSON.stringify({
			type: 'welcome',
			message: `Conectado a comunidad ${community.title} / canal ${channelName}`,
			communityId,
			communityName: community.title,
			channelId: channelIdFromConn,
			channelName: channelName,
		})
	)

	console.log(`[WS] Usuario ${cedula} conectado a ${community.title} / ${channelName}`)

	// Manejar mensajes: broadcast SOLO dentro de la misma comunidad
	socket.on('message', (raw) => {
		// Se asume que el cliente envía texto / JSON
		let payload: any
		try {
			payload = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(raw.toString())
		} catch {
			payload = { type: 'text', content: raw.toString() }
		}

		const channelId = payload?.channelId || channelIdFromConn
		if (!channelId) {
			socket.send(
				JSON.stringify({
					type: 'error',
					message: 'Falta channelId en el payload del mensaje',
				})
			)
			return
		}

		const packet = {
			type: 'message',
			communityId,
			channelId,
			from: cedula,
			timestamp: new Date().toISOString(),
			data: payload,
		}

		// Persistir mensaje en la simulación de DB
		try {
			const comm = dbCommunities.find((c) => c.id === communityId)
			const user = dbUsers.find((u) => u.cedula === cedula)
			const chan = comm?.channels?.find((ch) => ch.id === channelId)
			if (!comm || !chan || !user) {
				// Si no encuentra algo clave, notificar y omitir persistencia
				socket.send(
					JSON.stringify({
						type: 'error',
						message: 'Comunidad/Canal/Usuario no válido para guardar',
					})
				)
			} else {
				chan.messages = chan.messages || []
				chan.messages.push({
					id: generateUUID(),
					owner: user,
					content: String(payload?.text ?? payload?.content ?? ''),
					timestamp: packet.timestamp,
				})
				// ====== GUARDAR CAMBIOS EN ARCHIVO ======
				saveChanges()
				console.log(`[WS] Mensaje guardado en ${comm.title} / ${chan.name}`)
				// ========================================
			}
		} catch (e) {
			console.warn('No se pudo persistir el mensaje en DB simulada:', e)
		}

		const targetsMap = channelSockets.get(communityId)
		const targets = targetsMap?.get(channelId)
		if (!targets) return
		targets.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(JSON.stringify(packet))
			}
		})
	})

	// Al cerrar: limpiar y eliminar grupo si queda vacío
	socket.on('close', () => {
		const chanMapClose = channelSockets.get(communityId)
		if (chanMapClose) {
			const group = chanMapClose.get(channelIdFromConn!)
			if (group) {
				group.delete(socket)
				if (group.size === 0) {
					chanMapClose.delete(channelIdFromConn!)
				}
			}
			if (chanMapClose.size === 0) {
				channelSockets.delete(communityId)
				console.log(`WS: comunidad ${communityId} sin canales activos.`)
			}
		}
		console.log(
			`WS: conexión cerrada para usuario ${cedula} en comunidad ${communityId} canal ${channelIdFromConn}`
		)
	})
})

console.log(
	'Servidor WS escuchando en la ruta /ws (query: communityId, cedula, channelId)'
)
