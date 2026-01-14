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
	private readonly communityServiceUrl = 'http://localhost:3000/CommunityService.svc'

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
		const requestBody = this.soap.buildRequestBody({
			title: data.title,
			description: data.description,
			ownerCedula: data.ownerCedula
		})

		return this.soap.call(this.communityServiceUrl, 'CreateCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.CreateCommunityResult || soapResponse
				return this.parseCommunityResponse(result)
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
		const requestBody = this.soap.buildRequestBody({ userCedula: cedula })

		return this.soap.call(this.communityServiceUrl, 'GetCommunitiesByUser', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetCommunitiesByUserResult || soapResponse
				const communities = this.extractArray(result?.Communities).map((c: any) => this.parseCommunity(c))
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

	// Helper methods
	private parseCommunityResponse(result: any): any {
		const success = this.extractText(result?.Success)
		const message = this.extractText(result?.Message)
		const community = result?.Community ? this.parseCommunity(result.Community) : null

		return { success, message, community }
	}

	private parseCommunity(node: any): any {
		if (!node) return null

		return {
			id: this.extractText(node?.Id),
			title: this.extractText(node?.Title),
			description: this.extractText(node?.Description),
			ownerCedula: this.extractText(node?.OwnerCedula),
			createdAt: this.extractText(node?.CreatedAt),
			members: this.extractArray(node?.Members?.string),
			channels: this.extractArray(node?.Channels?.ChannelResponse)
		}
	}

	private extractText(node: any): any {
		if (!node) return null
		return node?.['#text'] || node || null
	}

	private extractArray(node: any): any[] {
		if (!node) return []
		return Array.isArray(node) ? node : [node]
	}
}
