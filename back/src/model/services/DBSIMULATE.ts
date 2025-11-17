import { generateUUID } from '../../utils/static'
import { Community, User } from '../schemas/db'

export const dbUsers: User[] = []
export const dbCommunities: Community[] = []

const user1: User = {
	cedula: '0102030405',
	name: 'John',
	lastName: 'Doe',
	email: 'john@example.com',
	password: 'hashedPassword123',
	address: '123 Main St, Springfield',
	profileImg: '/src/assets/profiles/0102030405.jpg',
}

const user2: User = {
	cedula: '1122334455',
	name: 'Jane',
	lastName: 'Smith',
	email: 'jane@example.com',
	password: 'hashedPassword456',
	address: '456 Oak Ave, Riverdale',
	profileImg: '/src/assets/profiles/1122334455.jpg',
}

const user3: User = {
	cedula: '0918273645',
	name: 'Bob',
	lastName: 'Wilson',
	email: 'bob@example.com',
	password: 'hashedPassword789',
	address: '789 Pine Rd, Hill Valley',
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
