import { Request, Response } from 'express'
import { dbCommunities, dbUsers } from '../model/services/DBSIMULATE'
import { generateUUID } from '../utils/static'
import { Community } from '../model/schemas/db'

// CREATE - Crear nueva comunidad
export const createCommunity = (req: Request, res: Response) => {
	try {
		const { title, description, ownerCedula } = req.body

		// Validar entrada
		if (!title || !description || !ownerCedula) {
			return res.status(400).json({
				success: false,
				message: 'Faltan campos requeridos: title, description, ownerCedula',
			})
		}

		// Buscar propietario
		const owner = dbUsers.find((u) => u.cedula === ownerCedula)
		if (!owner) {
			return res.status(404).json({
				success: false,
				message: 'Usuario propietario no encontrado',
			})
		}

		// Crear nueva comunidad
		const newCommunity: Community = {
			id: generateUUID(),
			title,
			description,
			owner,
			members: [owner],
			channels: [],
		}

		dbCommunities.push(newCommunity)

		return res.status(201).json({
			success: true,
			message: 'Comunidad creada exitosamente',
			community: newCommunity,
		})
	} catch (error) {
		console.error('Error al crear comunidad:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al crear comunidad',
			error: error instanceof Error ? error.message : 'Error desconocido',
		})
	}
}

// READ - Obtener todas las comunidades
export const getAllCommunities = (_req: Request, res: Response) => {
	try {
		return res.status(200).json({
			success: true,
			communities: dbCommunities,
		})
	} catch (error) {
		console.error('Error al obtener comunidades:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al obtener comunidades',
		})
	}
}

// READ - Obtener comunidades por usuario (miembro)
export const getCommunitiesByUser = (req: Request, res: Response) => {
	try {
		const { cedula } = req.params

		const userCommunities = dbCommunities.filter((c) =>
			c.members.some((m) => m.cedula === cedula)
		)

		return res.status(200).json({
			success: true,
			communities: userCommunities,
		})
	} catch (error) {
		console.error('Error al obtener comunidades del usuario:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al obtener comunidades',
		})
	}
}

// READ - Obtener una comunidad por ID
export const getCommunityById = (req: Request, res: Response) => {
	try {
		const { id } = req.params

		const community = dbCommunities.find((c) => c.id === id)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		return res.status(200).json({
			success: true,
			community,
		})
	} catch (error) {
		console.error('Error al obtener comunidad:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al obtener comunidad',
		})
	}
}

// UPDATE - Actualizar comunidad
export const updateCommunity = (req: Request, res: Response) => {
	try {
		const { id } = req.params
		const { title, description } = req.body

		const community = dbCommunities.find((c) => c.id === id)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		if (title) community.title = title
		if (description) community.description = description

		return res.status(200).json({
			success: true,
			message: 'Comunidad actualizada exitosamente',
			community,
		})
	} catch (error) {
		console.error('Error al actualizar comunidad:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al actualizar comunidad',
		})
	}
}

// DELETE - Eliminar comunidad
export const deleteCommunity = (req: Request, res: Response) => {
	try {
		const { id } = req.params

		const index = dbCommunities.findIndex((c) => c.id === id)
		if (index === -1) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		const deletedCommunity = dbCommunities.splice(index, 1)

		return res.status(200).json({
			success: true,
			message: 'Comunidad eliminada exitosamente',
			community: deletedCommunity[0],
		})
	} catch (error) {
		console.error('Error al eliminar comunidad:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al eliminar comunidad',
		})
	}
}

// ADD MEMBER - Agregar miembro a comunidad
export const addMemberToCommunity = (req: Request, res: Response) => {
	try {
		const { communityId, memberCedula } = req.body

		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		const member = dbUsers.find((u) => u.cedula === memberCedula)
		if (!member) {
			return res.status(404).json({
				success: false,
				message: 'Usuario no encontrado',
			})
		}

		const alreadyMember = community.members.some((m) => m.cedula === memberCedula)
		if (alreadyMember) {
			return res.status(400).json({
				success: false,
				message: 'El usuario ya es miembro de esta comunidad',
			})
		}

		community.members.push(member)

		return res.status(200).json({
			success: true,
			message: 'Miembro agregado a la comunidad',
			community,
		})
	} catch (error) {
		console.error('Error al agregar miembro:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al agregar miembro',
		})
	}
}

// REMOVE MEMBER - Remover miembro de comunidad
export const removeMemberFromCommunity = (req: Request, res: Response) => {
	try {
		const { communityId, memberCedula } = req.body

		const community = dbCommunities.find((c) => c.id === communityId)
		if (!community) {
			return res.status(404).json({
				success: false,
				message: 'Comunidad no encontrada',
			})
		}

		const memberIndex = community.members.findIndex((m) => m.cedula === memberCedula)
		if (memberIndex === -1) {
			return res.status(404).json({
				success: false,
				message: 'Miembro no encontrado en la comunidad',
			})
		}

		const removedMember = community.members.splice(memberIndex, 1)

		return res.status(200).json({
			success: true,
			message: 'Miembro removido de la comunidad',
			member: removedMember[0],
		})
	} catch (error) {
		console.error('Error al remover miembro:', error)
		return res.status(500).json({
			success: false,
			message: 'Error al remover miembro',
		})
	}
}
