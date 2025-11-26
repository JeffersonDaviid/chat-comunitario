import { generateUUID } from '../../utils/static'
import { Community, User } from '../schemas/db'
import { loadCommunitiesFromFile, loadUsersFromFile, saveCommunitiesToFile, saveUsersToFile } from './file-storage'

// Declarar como exportable
export let dbUsers: User[] = []
export let dbCommunities: Community[] = []

const user1: User = {
	cedula: '0102030405',
	name: 'John',
	lastName: 'Doe',
	email: 'john@example.com',
	password: 'hashedPassword123',
	phone: '0987654321',
	address: '123 Main St, Springfield',
	latitude: -0.1807,
	longitude: -78.4678,
	profileImg: '/src/assets/profiles/0102030405.jpg',
}

const user2: User = {
	cedula: '1122334455',
	name: 'Jane',
	lastName: 'Smith',
	email: 'jane@example.com',
	password: 'hashedPassword456',
	phone: '0987654322',
	address: '456 Oak Ave, Riverdale',
	latitude: -0.2299,
	longitude: -78.5249,
	profileImg: '/src/assets/profiles/1122334455.jpg',
}

const user3: User = {
	cedula: '0918273645',
	name: 'Bob',
	lastName: 'Wilson',
	email: 'bob@example.com',
	password: 'hashedPassword789',
	phone: '0987654323',
	address: '789 Pine Rd, Hill Valley',
	latitude: -0.9312,
	longitude: -78.6146,
	profileImg: '/src/assets/profiles/0918273645.jpg',
}

const community1: Community = {
	id: generateUUID(),
	title: 'Tech Enthusiasts',
	description: 'A community for technology lovers',
	owner: user1,
	members: [user1, user2, user3],
	channels: [
		{
			id: generateUUID(),
			name: 'general',
			description: 'General discussion',
			messages: [
				{
					id: generateUUID(),
					owner: user2,
					content: '¡Bienvenidos a Tech Enthusiasts!',
					timestamp: new Date().toISOString(),
				},
			],
		},
	],
}

const community2: Community = {
	id: generateUUID(),
	title: 'Gaming Hub',
	description: 'Discuss your favorite games here',
	owner: user2,
	members: [user2, user3],
	channels: [
		{
			id: generateUUID(),
			name: 'news',
			description: 'Gaming news and updates',
			messages: [
				{
					id: generateUUID(),
					owner: user3,
					content: 'Nuevo parche 1.1 lanzado hoy.',
					timestamp: new Date().toISOString(),
				},
			],
		},
	],
}

dbUsers.push(user1, user2, user3)
dbCommunities.push(community1, community2)


export function initializeDatabaseWithPersistence() {
	// Intentar cargar datos guardados
	const savedUsers = loadUsersFromFile()
	const savedCommunities = loadCommunitiesFromFile()

	if (savedUsers.length > 0) {
		
		dbUsers.length = 0
		dbUsers.push(...savedUsers)
		console.log(`[DB] ${dbUsers.length} usuarios cargados desde archivo`)
	} else {
		saveUsersToFile(dbUsers)
		console.log('[DB] Datos de usuarios iniciales guardados')
	}

	if (savedCommunities.length > 0) {
		dbCommunities.length = 0
		dbCommunities.push(...savedCommunities)
		console.log(`[DB] ${dbCommunities.length} comunidades cargadas desde archivo`)
	} else {
		saveCommunitiesToFile(dbCommunities)
		console.log('[DB] Datos de comunidades iniciales guardados')
	}
}

export function saveChanges() {
	saveUsersToFile(dbUsers)
	saveCommunitiesToFile(dbCommunities)
}
