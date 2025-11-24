import express from 'express'
import {
	createChannel,
	getChannelsByCommunity,
	getChannelById,
	updateChannel,
	deleteChannel,
} from '../channel-ctrl'

export const channelRoute = express.Router()

// CRUD operations
channelRoute.post('/create', createChannel)
channelRoute.get('/community/:communityId', getChannelsByCommunity)
channelRoute.get('/:communityId/:channelId', getChannelById)
channelRoute.put('/:communityId/:channelId', updateChannel)
channelRoute.delete('/:communityId/:channelId', deleteChannel)
