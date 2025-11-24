import { Request, Response } from 'express'
import { dbCommunities } from '../model/services/DBSIMULATE'
import { generateUUID } from '../utils/static'
import { Channel } from '../model/schemas/db'

// CREATE - Crear nuevo canal en una comunidad
export const createChannel = (req: Request, res: Response) => {
	try {
		const { communityId, name, description } = req.body

		// Validar entrada
		if (!communityId || !name || !description) {
			return res.status(400).json({
				success: false,
				message: 'Faltan campos requeridos: communityId, name, description',
			})
		}

		// Buscar comunidad
		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		// Validar que el nombre del canal sea único en la comunidad
		if (community.channels?.some((ch) => ch.name === name)) {
			return res.status(400).json({
				success: false,
				message: 'Ya existe un canal con este nombre en la comunidad',
			})
		}

		// Crear nuevo canal
		const newChannel: Channel = {
			id: generateUUID(),
			name,
			description,
			messages: [],
		}

		// Agregar canal a la comunidad
		if (!community.channels) {
			community.channels = []
		}
		community.channels.push(newChannel)

		return res.status(201).json({
			success: true,
			message: 'Canal creado exitosamente',
			channel: newChannel,
		})
	} catch (error) {
		console.error('Error al crear canal:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al crear canal',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}

// READ - Obtener todos los canales de una comunidad
export const getChannelsByCommunity = (req: Request, res: Response) => {
	try {
		const { communityId } = req.params

		// Buscar comunidad
		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		return res.status(200).json({
			success: true,
			channels: community.channels || [],
		})
	} catch (error) {
		console.error('Error al obtener canales:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al obtener canales',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}

// READ - Obtener un canal específico por ID
export const getChannelById = (req: Request, res: Response) => {
	try {
		const { communityId, channelId } = req.params

		// Buscar comunidad
		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		// Buscar canal
		const channel = community.channels?.find((ch) => ch.id === channelId)
		if (!channel) {
			return res.status(404).json({
				success: false,
				message: 'Canal no encontrado',
			})
		}

		return res.status(200).json({
			success: true,
			channel,
		})
	} catch (error) {
		console.error('Error al obtener canal:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al obtener canal',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}

// UPDATE - Actualizar un canal
export const updateChannel = (req: Request, res: Response) => {
	try {
		const { communityId, channelId } = req.params
		const { name, description } = req.body

		// Validar entrada
		if (!name && !description) {
			return res.status(400).json({
				success: false,
				message: 'Debe proporcionar al menos un campo para actualizar',
			})
		}

		// Buscar comunidad
		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		// Buscar canal
		const channel = community.channels?.find((ch) => ch.id === channelId)
		if (!channel) {
			return res.status(404).json({
				success: false,
				message: 'Canal no encontrado',
			})
		}

		// Validar nombre único si se está actualizando
		if (name && name !== channel.name) {
			if (community.channels?.some((ch) => ch.name === name && ch.id !== channelId)) {
				return res.status(400).json({
					success: false,
					message: 'Ya existe un canal con este nombre',
				})
			}
		}

		// Actualizar campos
		if (name) channel.name = name
		if (description) channel.description = description

		return res.status(200).json({
			success: true,
			message: 'Canal actualizado exitosamente',
			channel,
		})
	} catch (error) {
		console.error('Error al actualizar canal:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al actualizar canal',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}

// DELETE - Eliminar un canal
export const deleteChannel = (req: Request, res: Response) => {
	try {
		const { communityId, channelId } = req.params

		// Buscar comunidad
		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		// Verificar que el canal existe
		const channelIndex = community.channels?.findIndex((ch) => ch.id === channelId)
		if (channelIndex === undefined || channelIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Canal no encontrado',
			})
		}

		// Eliminar canal
		community.channels?.splice(channelIndex, 1)

		return res.status(200).json({
			success: true,
			message: 'Canal eliminado exitosamente',
		})
	} catch (error) {
		console.error('Error al eliminar canal:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al eliminar canal',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}
