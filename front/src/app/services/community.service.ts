import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SoapClientService } from './soap-client.service'

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
	private readonly communityServiceUrl = 'http://localhost:5000/CommunityService.svc'

	constructor(
		private http: HttpClient,
		private soap: SoapClientService
	) {}

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
			ownerCedula: data.ownerCedula
		})

		return this.soap.call(this.communityServiceUrl, 'CreateCommunity', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] CreateCommunity SOAP response:', soapResponse)
				const result = soapResponse?.CreateCommunityResult || soapResponse
				const parsed = this.parseCommunityResponse(result)
				console.log('[CommunityService] Parsed create response:', parsed)
				return parsed
			})
		)
	}

	// READ - Obtener todas las comunidades
	getAllCommunities(): Observable<any> {
		// GetAllCommunities no requiere parámetros
		const requestBody = ''

		return this.soap.call(this.communityServiceUrl, 'GetAllCommunities', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetAllCommunitiesResult || soapResponse
				const communities = this.extractArray(result?.Communities).map((c: any) => this.parseCommunity(c))
				return { success: true, communities }
			})
		)
	}

	// READ - Obtener comunidades por usuario
	getCommunitiesByUser(cedula: string): Observable<any> {
		console.log('[CommunityService] Fetching communities for cedula:', cedula)
		const requestBody = this.soap.buildRequestBody({ cedula: cedula })

		return this.soap.call(this.communityServiceUrl, 'GetCommunitiesByUser', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] SOAP Response:', soapResponse)
				const result = soapResponse?.GetCommunitiesByUserResult || soapResponse
				console.log('[CommunityService] Result:', result)
				
				const communitiesNode = result?.Communities?.CommunityResponse || result?.Communities
				console.log('[CommunityService] Communities Node:', communitiesNode)
				
				const communities = this.extractArray(communitiesNode).map((c: any) => {
					const parsed = this.parseCommunity(c)
					console.log('[CommunityService] Parsed community:', parsed)
					return parsed
				})
				
				console.log('[CommunityService] Total communities:', communities.length)
				return { success: true, communities }
			})
		)
	}

	// READ - Obtener comunidad por ID
	getCommunityById(id: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ communityId: id })

		return this.soap.call(this.communityServiceUrl, 'GetCommunityById', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetCommunityByIdResult || soapResponse
				const community = result?.Community
				return { 
					success: true, 
					community: community ? this.parseCommunity(community) : null 
				}
			})
		)
	}

	// UPDATE - Actualizar comunidad
	updateCommunity(
		id: string,
		data: { title?: string; description?: string }
	): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: id,
			title: data.title || '',
			description: data.description || ''
		})

		return this.soap.call(this.communityServiceUrl, 'UpdateCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.UpdateCommunityResult || soapResponse
				return this.parseCommunityResponse(result)
			})
		)
	}

	// DELETE - Eliminar comunidad
	deleteCommunity(id: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ communityId: id })

		return this.soap.call(this.communityServiceUrl, 'DeleteCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.DeleteCommunityResult || soapResponse
				return this.parseCommunityResponse(result)
			})
		)
	}

	// ADD MEMBER - Agregar miembro a comunidad
	addMemberToCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: data.communityId,
			cedulaMember: data.memberCedula
		})

		return this.soap.call(this.communityServiceUrl, 'AddMember', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.AddMemberResult || soapResponse
				return this.parseCommunityResponse(result)
			})
		)
	}

	// REMOVE MEMBER - Remover miembro de comunidad
	removeMemberFromCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: data.communityId,
			cedulaMember: data.memberCedula
		})

		return this.soap.call(this.communityServiceUrl, 'RemoveMember', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.RemoveMemberResult || soapResponse
				return this.parseCommunityResponse(result)
			})
		)
	}

	// GET - Obtener usuarios disponibles para invitar
	getAvailableUsers(excludeCedula: string): Observable<any> {
		console.log('[CommunityService] getAvailableUsers called with excludeCedula:', excludeCedula)
		const requestBody = this.soap.buildRequestBody({
			excludeCedula: excludeCedula
		})

		return this.soap.call(this.communityServiceUrl, 'GetAvailableUsers', requestBody).pipe(
			map((soapResponse) => {
				console.log('[CommunityService] GetAvailableUsers SOAP response:', soapResponse)
				const result = soapResponse?.GetAvailableUsersResult || soapResponse
				console.log('[CommunityService] Result extracted:', result)
				const parsed = this.parseAvailableUsersResponse(result)
				console.log('[CommunityService] Parsed response:', parsed)
				return parsed
			})
		)
	}

	// POST - Invitar múltiples usuarios a una comunidad
	inviteUsers(communityId: string, userCedulas: string[]): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			communityId: communityId,
			userCedulas: userCedulas
		})

		return this.soap.call(this.communityServiceUrl, 'InviteUsers', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.InviteUsersResult || soapResponse
				return this.parseInviteResponse(result)
			})
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
		if (channelsNode && typeof channelsNode === 'object' && !Array.isArray(channelsNode)) {
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
				communityId: this.extractText(ch?.CommunityId)
			}
			console.log('[CommunityService] Parsed channel:', channel)
			return channel
		})

		// Parsear miembros
		const membersNode = node?.Members?.UserResponse || node?.Members?.string || node?.Members
		const members = this.extractArray(membersNode)

		const community = {
			id: this.extractText(node?.Id),
			title: this.extractText(node?.Title),
			description: this.extractText(node?.Description),
			ownerCedula: this.extractText(node?.OwnerCedula),
			createdAt: this.extractText(node?.CreatedAt),
			members: members,
			channels: channels
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
		return users.map(u => ({
			cedula: this.extractText(u?.Cedula),
			name: this.extractText(u?.Name),
			lastName: this.extractText(u?.LastName),
			email: this.extractText(u?.Email),
			profileImg: this.extractText(u?.ProfileImg)
		}))
	}
}
