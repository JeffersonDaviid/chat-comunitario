"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbCommunities = exports.dbUsers = void 0;
const static_1 = require("../../utils/static");
exports.dbUsers = [];
exports.dbCommunities = [];
const user1 = {
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
};
const user2 = {
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
};
const user3 = {
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
};
const community1 = {
    id: (0, static_1.generateUUID)(),
    title: 'Tech Enthusiasts',
    description: 'A community for technology lovers',
    owner: user1,
    members: [user1, user2, user3],
    channels: [
        {
            id: (0, static_1.generateUUID)(),
            name: 'general',
            description: 'General discussion',
            messages: [
                {
                    id: (0, static_1.generateUUID)(),
                    owner: user2,
                    content: '¡Bienvenidos a Tech Enthusiasts!',
                    timestamp: new Date().toISOString(),
                },
            ],
        },
    ],
};
const community2 = {
    id: (0, static_1.generateUUID)(),
    title: 'Gaming Hub',
    description: 'Discuss your favorite games here',
    owner: user2,
    members: [user2, user3],
    channels: [
        {
            id: (0, static_1.generateUUID)(),
            name: 'news',
            description: 'Gaming news and updates',
            messages: [
                {
                    id: (0, static_1.generateUUID)(),
                    owner: user3,
                    content: 'Nuevo parche 1.1 lanzado hoy.',
                    timestamp: new Date().toISOString(),
                },
            ],
        },
    ],
};
exports.dbUsers.push(user1, user2, user3);
exports.dbCommunities.push(community1, community2);
