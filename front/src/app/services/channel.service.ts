import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SoapClientService } from './soap-client.service'

export interface Channel {
	id: string
	name: string
	description: string
	messages?: any[]
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
	private readonly channelServiceUrl = 'http://localhost:3000/ChannelService.svc'

	constructor(
		private http: HttpClient,
		private soap: SoapClientService
	) {}

	// CREATE - Crear nuevo canal
	createChannel(data: {
		communityId: string
		name: string
		description: string
	}): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			name: data.name,
			description: data.description,
			communityId: data.communityId
		})

		return this.soap.call(this.channelServiceUrl, 'CreateChannel', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.CreateChannelResult || soapResponse
				return this.parseChannelResponse(result)
			})
		)
	}

	// READ - Obtener canales por comunidad
	getChannelsByCommunity(communityId: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ communityId })

		return this.soap.call(this.channelServiceUrl, 'GetChannelsByCommunity', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetChannelsByCommunityResult || soapResponse
				const channels = this.extractArray(result?.Channels).map((c: any) => this.parseChannel(c))
				return { success: true, channels }
			})
		)
	}

	// READ - Obtener canal específico
	getChannelById(communityId: string, channelId: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ channelId })

		return this.soap.call(this.channelServiceUrl, 'GetChannelById', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.GetChannelByIdResult || soapResponse
				const channel = result?.Channel
				return { 
					success: true, 
					channel: channel ? this.parseChannel(channel) : null 
				}
			})
		)
	}

	// UPDATE - Actualizar canal
	updateChannel(
		communityId: string,
		channelId: string,
		data: { name?: string; description?: string }
	): Observable<any> {
		const requestBody = this.soap.buildRequestBody({
			channelId: channelId,
			name: data.name || '',
			description: data.description || ''
		})

		return this.soap.call(this.channelServiceUrl, 'UpdateChannel', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.UpdateChannelResult || soapResponse
				return this.parseChannelResponse(result)
			})
		)
	}

	// DELETE - Eliminar canal
	deleteChannel(communityId: string, channelId: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ channelId })

		return this.soap.call(this.channelServiceUrl, 'DeleteChannel', requestBody).pipe(
			map((soapResponse) => {
				const result = soapResponse?.DeleteChannelResult || soapResponse
				return this.parseChannelResponse(result)
			})
		)
	}

	// Helper methods
	private parseChannelResponse(result: any): any {
		const success = this.extractText(result?.Success)
		const message = this.extractText(result?.Message)
		const channel = result?.Channel ? this.parseChannel(result.Channel) : null

		return { success, message, channel }
	}

	private parseChannel(node: any): any {
		if (!node) return null

		return {
			id: this.extractText(node?.Id),
			name: this.extractText(node?.Name),
			description: this.extractText(node?.Description),
			communityId: this.extractText(node?.CommunityId),
			createdAt: this.extractText(node?.CreatedAt)
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
