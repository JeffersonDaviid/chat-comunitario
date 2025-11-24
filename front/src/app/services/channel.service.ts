import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

export interface Channel {
	id: string
	name: string
	description: string
	messages?: any[]
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
	private readonly baseApi = 'http://localhost:3000/api/channel'

	constructor(private http: HttpClient) {}

	// CREATE - Crear nuevo canal
	createChannel(data: {
		communityId: string
		name: string
		description: string
	}): Observable<any> {
		return this.http.post<any>(`${this.baseApi}/create`, data)
	}

	// READ - Obtener canales por comunidad
	getChannelsByCommunity(communityId: string): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/community/${communityId}`)
	}

	// READ - Obtener canal específico
	getChannelById(communityId: string, channelId: string): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/${communityId}/${channelId}`)
	}

	// UPDATE - Actualizar canal
	updateChannel(
		communityId: string,
		channelId: string,
		data: { name?: string; description?: string }
	): Observable<any> {
		return this.http.put<any>(`${this.baseApi}/${communityId}/${channelId}`, data)
	}

	// DELETE - Eliminar canal
	deleteChannel(communityId: string, channelId: string): Observable<any> {
		return this.http.delete<any>(`${this.baseApi}/${communityId}/${channelId}`)
	}
}
