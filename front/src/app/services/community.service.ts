import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SoapClientService } from './soap-client.service'
import { communityServiceUrl } from '../conf/global'

export interface Community {
	id: string
	title: string
	description: string
	owner: any
	members: any[]
	channels?: any[]
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
	constructor(private readonly soap: SoapClientService) {}

	// CREATE - Crear nueva comunidad
	createCommunity(data: {
		title: string
		description: string
		ownerCedula: string
	}): Observable<any> {
		console.log('[CommunityService] Creating community:', data)
		const requestBody = this.soap.buildRequestBody({
			title: data.title,
			description: data.description,
			ownerCedula: data.ownerCedula,
		})

		return this.soap.call(communityServiceUrl, 'CreateCommunity', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] CreateCommunity SOAP response:', soapResponse)
				const result = soapResponse?.CreateCommunityResult || soapResponse
				const parsed = this.parseCommunityResponse(result)
				console.log('[CommunityService] Parsed create response:', parsed)
				return parsed
			}),
		)
	}

	// READ - Obtener todas las comunidades
	getAllCommunities(): Observable<any> {
		// GetAllCommunities no requiere parámetros
		const requestBody = ''

		return this.soap.call(communityServiceUrl, 'GetAllCommunities', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetAllCommunitiesResult || soapResponse
				const communities = this.extractArray(result?.Communities).map((c: any) =>
					this.parseCommunity(c),
				)
				return { success: true, communities }
			}),
		)
	}

	// READ - Obtener comunidades por usuario
	getCommunitiesByUser(cedula: string): Observable<any> {
		console.log('[CommunityService] Fetching communities for cedula:', cedula)
		const requestBody = this.soap.buildRequestBody({ cedula: cedula })

		return this.soap.call(communityServiceUrl, 'GetCommunitiesByUser', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] SOAP Response:', soapResponse)
				const result = soapResponse?.GetCommunitiesByUserResult || soapResponse
				console.log('[CommunityService] Result:', result)

				const communitiesNode =
					result?.Communities?.CommunityResponse || result?.Communities
				console.log('[CommunityService] Communities Node:', communitiesNode)

				const communities = this.extractArray(communitiesNode).map((c: any) => {
					const parsed = this.parseCommunity(c)
					console.log('[CommunityService] Parsed community:', parsed)
					return parsed
				})

				console.log('[CommunityService] Total communities:', communities.length)
				return { success: true, communities }
			}),
		)
	}

	// READ - Obtener comunidad por ID
	getCommunityById(id: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ communityId: id })

		return this.soap.call(communityServiceUrl, 'GetCommunityById', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetCommunityByIdResult || soapResponse
				const community = result?.Community
				return {
					success: true,
					community: community ? this.parseCommunity(community) : null,
				}
			}),
		)
	}

	// UPDATE - Actualizar comunidad
	updateCommunity(
		id: string,
		data: { title?: string; description?: string },
	): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: id,
			title: data.title || '',
			description: data.description || '',
		})

		return this.soap.call(communityServiceUrl, 'UpdateCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.UpdateCommunityResult || soapResponse
				return this.parseCommunityResponse(result)
			}),
		)
	}

	// DELETE - Eliminar comunidad
	deleteCommunity(id: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ communityId: id })

		return this.soap.call(communityServiceUrl, 'DeleteCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.DeleteCommunityResult || soapResponse
				return this.parseCommunityResponse(result)
			}),
		)
	}

	// ADD MEMBER - Agregar miembro a comunidad
	addMemberToCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: data.communityId,
			cedulaMember: data.memberCedula,
		})

		return this.soap.call(communityServiceUrl, 'AddMember', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.AddMemberResult || soapResponse
				return this.parseCommunityResponse(result)
			}),
		)
	}

	// REMOVE MEMBER - Remover miembro de comunidad
	removeMemberFromCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: data.communityId,
			cedulaMember: data.memberCedula,
		})

		return this.soap.call(communityServiceUrl, 'RemoveMember', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.RemoveMemberResult || soapResponse
				return this.parseCommunityResponse(result)
			}),
		)
	}

	// GET - Obtener usuarios disponibles para invitar
	getAvailableUsers(excludeCedula: string): Observable<any> {
		console.log(
			'[CommunityService] getAvailableUsers called with excludeCedula:',
			excludeCedula,
		)
		const requestBody = this.soap.buildRequestBody({
			excludeCedula: excludeCedula,
		})

		return this.soap.call(communityServiceUrl, 'GetAvailableUsers', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] GetAvailableUsers SOAP response:', soapResponse)
				const result = soapResponse?.GetAvailableUsersResult || soapResponse
				console.log('[CommunityService] Result extracted:', result)
				const parsed = this.parseAvailableUsersResponse(result)
				console.log('[CommunityService] Parsed response:', parsed)
				return parsed
			}),
		)
	}

	// POST - Invitar múltiples usuarios a una comunidad
	inviteUsers(communityId: string, userCedulas: string[]): Observable<any> {
		// Enviar las cédulas como CSV en lugar de array para evitar problemas de serialización SOAP
		const requestBody = this.soap.buildRequestBody({
			communityId: communityId,
			userCedulasCSV: userCedulas.join(','),
		})

		return this.soap.call(communityServiceUrl, 'InviteUsers', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.InviteUsersResult || soapResponse
				return this.parseInviteResponse(result)
			}),
		)
	}

	// Helper methods
	private parseCommunityResponse(result: any): any {
		const success = this.extractText(result?.Success)
		const message = this.extractText(result?.Message)
		const community = result?.Community ? this.parseCommunity(result.Community) : null

		return { success, message, community }
	}

	private parseCommunity(node: any): any {
		if (!node) {
			console.log('[CommunityService] parseCommunity received null node')
			return null
		}

		console.log('[CommunityService] Parsing community node:', node)

		// Parsear canales correctamente - probar diferentes estructuras
		let channelsNode = node?.Channels?.ChannelResponse || node?.Channels
		console.log('[CommunityService] Raw channels node:', channelsNode)

		// Si channelsNode es un objeto con propiedades, convertirlo a array
		if (
			channelsNode &&
			typeof channelsNode === 'object' &&
			!Array.isArray(channelsNode)
		) {
			// Puede ser un objeto con una única propiedad que contiene el array
			const keys = Object.keys(channelsNode)
			if (keys.length > 0 && Array.isArray(channelsNode[keys[0]])) {
				channelsNode = channelsNode[keys[0]]
			}
		}

		const channels = this.extractArray(channelsNode).map((ch: any) => {
			const channel = {
				id: this.extractText(ch?.Id),
				name: this.extractText(ch?.Name),
				description: this.extractText(ch?.Description),
				communityId: this.extractText(ch?.CommunityId),
				isGeneral: this.extractText(ch?.IsGeneral) === 'true',
			}
			console.log('[CommunityService] Parsed channel:', channel)
			return channel
		})

		// Parsear miembros
		const membersNode =
			node?.Members?.UserResponse || node?.Members?.string || node?.Members
		const members = this.extractArray(membersNode)

		const community = {
			id: this.extractText(node?.Id),
			title: this.extractText(node?.Title),
			description: this.extractText(node?.Description),
			ownerCedula: this.extractText(node?.OwnerCedula),
			createdAt: this.extractText(node?.CreatedAt),
			members: members,
			channels: channels,
		}

		console.log('[CommunityService] Final parsed community:', community)
		return community
	}

	private extractText(node: any): any {
		if (!node) return null
		return node?.['#text'] || node || null
	}

	private extractArray(node: any): any[] {
		if (!node) return []
		// Si es un objeto vacío, retornar array vacío
		if (
			typeof node === 'object' &&
			!Array.isArray(node) &&
			Object.keys(node).length === 0
		) {
			return []
		}
		return Array.isArray(node) ? node : [node]
	}

	private parseAvailableUsersResponse(result: any): any {
		const success = this.extractText(result?.Success)
		const message = this.extractText(result?.Message)
		const usersNode = result?.Users
		console.log('[CommunityService] parseAvailableUsersResponse - usersNode:', usersNode)
		const users = this.parseUsersList(usersNode)
		console.log('[CommunityService] parseAvailableUsersResponse - parsed users:', users)

		return { success, message, users }
	}

	private parseInviteResponse(result: any): any {
		const success = this.extractText(result?.Success)
		const message = this.extractText(result?.Message)
		const invitedUsersNode = result?.InvitedUsers
		const invitedUsers = this.extractArray(invitedUsersNode?.string || invitedUsersNode)

		return { success, message, invitedUsers }
	}

	private parseUsersList(node: any): any[] {
		if (!node) return []

		const users = this.extractArray(node?.UserResponse || node)
		return users.map((u) => ({
			cedula: this.extractText(u?.Cedula),
			name: this.extractText(u?.Name),
			lastName: this.extractText(u?.LastName),
			email: this.extractText(u?.Email),
			profileImg: this.extractText(u?.ProfileImg),
		}))
	}

	// ==================== INVITACIONES ====================

	// GET - Obtener invitaciones pendientes del usuario
	getPendingInvitations(userCedula: string): Observable<any> {
		console.log('[CommunityService] Getting pending invitations for:', userCedula)
		const requestBody = this.soap.buildRequestBody({
			userCedula: userCedula,
		})

		return this.soap.call(communityServiceUrl, 'GetPendingInvitations', requestBody).pipe(
			map((soapResponse) => {
				console.log(
					'[CommunityService] GetPendingInvitations SOAP response:',
					soapResponse,
				)
				const result = soapResponse?.GetPendingInvitationsResult || soapResponse
				return this.parseInvitationsResponse(result)
			}),
		)
	}

	// POST - Aceptar invitación
	acceptInvitation(invitationId: string, userCedula: string): Observable<any> {
		console.log(
			'[CommunityService] Accepting invitation:',
			invitationId,
			'Type:',
			typeof invitationId,
		)
		console.log('[CommunityService] User cedula:', userCedula)

		const requestBody = this.soap.buildRequestBody({
			invitationId: invitationId,
			userCedula: userCedula,
		})
		console.log('[CommunityService] Request body:', requestBody)

		return this.soap.call(communityServiceUrl, 'AcceptInvitation', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] AcceptInvitation SOAP response:', soapResponse)
				const result = soapResponse?.AcceptInvitationResult || soapResponse
				return {
					success: this.extractText(result?.Success) === 'true',
					message: this.extractText(result?.Message),
				}
			}),
		)
	}

	// POST - Rechazar invitación
	rejectInvitation(invitationId: string, userCedula: string): Observable<any> {
		console.log('[CommunityService] Rejecting invitation:', invitationId)
		const requestBody = this.soap.buildRequestBody({
			invitationId: invitationId,
			userCedula: userCedula,
		})

		return this.soap.call(communityServiceUrl, 'RejectInvitation', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] RejectInvitation SOAP response:', soapResponse)
				const result = soapResponse?.RejectInvitationResult || soapResponse
				return {
					success: this.extractText(result?.Success) === 'true',
					message: this.extractText(result?.Message),
				}
			}),
		)
	}

	private parseInvitationsResponse(result: any): any {
		const success = this.extractText(result?.Success) === 'true'
		const message = this.extractText(result?.Message)
		const invitationsNode = result?.Invitations
		console.log('[CommunityService] Raw invitations node:', invitationsNode)

		// Si no hay nodo de invitaciones o está vacío, retornar array vacío
		if (!invitationsNode) {
			console.log('[CommunityService] No invitations node found, returning empty array')
			return { success, message, invitations: [] }
		}

		const rawArray = invitationsNode?.InvitationResponse || invitationsNode

		// Si el array es vacío o no es un objeto válido
		if (
			!rawArray ||
			(typeof rawArray === 'object' && Object.keys(rawArray).length === 0)
		) {
			console.log('[CommunityService] Invitations node is empty, returning empty array')
			return { success, message, invitations: [] }
		}

		const invitations = this.extractArray(rawArray)
			.filter((inv: any) => inv && inv.Id) // Solo items con Id válido
			.map((inv: any) => {
				console.log('[CommunityService] Raw invitation item:', inv)
				console.log('[CommunityService] Raw invitation Id:', inv?.Id)

				const parsed = {
					id: this.extractText(inv?.Id),
					communityId: this.extractText(inv?.CommunityId),
					communityTitle: this.extractText(inv?.CommunityTitle),
					communityDescription: this.extractText(inv?.CommunityDescription),
					invitedByName: this.extractText(inv?.InvitedByName),
					invitedByCedula: this.extractText(inv?.InvitedByCedula),
					createdAt: this.extractText(inv?.CreatedAt),
				}
				console.log('[CommunityService] Parsed invitation:', parsed)
				return parsed
			})

		console.log('[CommunityService] Final parsed invitations:', invitations)
		return { success, message, invitations }
	}
}
