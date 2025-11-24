import express from 'express'
import {
	createCommunity,
	getAllCommunities,
	getCommunitiesByUser,
	getCommunityById,
	updateCommunity,
	deleteCommunity,
	addMemberToCommunity,
	removeMemberFromCommunity,
} from '../community-ctrl'

export const communityRoute = express.Router()

// CRUD operations
communityRoute.post('/create', createCommunity)
communityRoute.get('/all', getAllCommunities)
communityRoute.get('/user/:cedula', getCommunitiesByUser)
communityRoute.get('/:id', getCommunityById)
communityRoute.put('/:id', updateCommunity)
communityRoute.delete('/:id', deleteCommunity)

// Member operations
communityRoute.post('/member/add', addMemberToCommunity)
communityRoute.post('/member/remove', removeMemberFromCommunity)
