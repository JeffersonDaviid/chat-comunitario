import fs from 'fs'
import path from 'path'
import { Community, User } from '../schemas/db'


const DATA_DIR = path.join(process.cwd(), 'src', 'assets', 'data')
const COMMUNITIES_FILE = path.join(DATA_DIR, 'communities.json')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

function ensureDataDir() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true })
		console.log(`[Storage] Directorio de datos creado: ${DATA_DIR}`)
	}
}
export function loadCommunitiesFromFile(): Community[] {
	ensureDataDir()
	try {
		if (fs.existsSync(COMMUNITIES_FILE)) {
			const data = fs.readFileSync(COMMUNITIES_FILE, 'utf-8')
			console.log('[Storage] Comunidades cargadas desde archivo')
			return JSON.parse(data)
		}
	} catch (error) {
		console.error('[Storage] Error al cargar comunidades:', error)
	}
	return []
}

export function loadUsersFromFile(): User[] {
	ensureDataDir()
	try {
		if (fs.existsSync(USERS_FILE)) {
			const data = fs.readFileSync(USERS_FILE, 'utf-8')
			console.log('[Storage] Usuarios cargados desde archivo')
			return JSON.parse(data)
		}
	} catch (error) {
		console.error('[Storage] Error al cargar usuarios:', error)
	}
	return []
}


export function saveCommunitiesToFile(communities: Community[]): boolean {
	ensureDataDir()
	try {
		fs.writeFileSync(COMMUNITIES_FILE, JSON.stringify(communities, null, 2), 'utf-8')
		console.log('[Storage] Comunidades guardadas en archivo')
		return true
	} catch (error) {
		console.error('[Storage] Error al guardar comunidades:', error)
		return false
	}
}


export function saveUsersToFile(users: User[]): boolean {
	ensureDataDir()
	try {
		fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8')
		console.log('[Storage] Usuarios guardados en archivo')
		return true
	} catch (error) {
		console.error('[Storage] Error al guardar usuarios:', error)
		return false
	}
}


export function findAndUpdateCommunity(
	communities: Community[],
	communityId: string,
	updater: (c: Community) => void
): Community | null {
	const comm = communities.find((c) => c.id === communityId)
	if (comm) {
		updater(comm)
		saveCommunitiesToFile(communities)
	}
	return comm || null
}
