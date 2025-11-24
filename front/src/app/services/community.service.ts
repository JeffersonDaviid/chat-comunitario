import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

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
	private readonly baseApi = 'http://localhost:3000/api/community'

	constructor(private http: HttpClient) {}

	// CREATE - Crear nueva comunidad
	createCommunity(data: {
		title: string
		description: string
		ownerCedula: string
	}): Observable<any> {
		return this.http.post<any>(`${this.baseApi}/create`, data)
	}

	// READ - Obtener todas las comunidades
	getAllCommunities(): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/all`)
	}

	// READ - Obtener comunidades por usuario
	getCommunitiesByUser(cedula: string): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/user/${cedula}`)
	}

	// READ - Obtener comunidad por ID
	getCommunityById(id: string): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/${id}`)
	}

	// UPDATE - Actualizar comunidad
	updateCommunity(
		id: string,
		data: { title?: string; description?: string }
	): Observable<any> {
		return this.http.put<any>(`${this.baseApi}/${id}`, data)
	}

	// DELETE - Eliminar comunidad
	deleteCommunity(id: string): Observable<any> {
		return this.http.delete<any>(`${this.baseApi}/${id}`)
	}

	// ADD MEMBER - Agregar miembro a comunidad
	addMemberToCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		return this.http.post<any>(`${this.baseApi}/member/add`, data)
	}

	// REMOVE MEMBER - Remover miembro de comunidad
	removeMemberFromCommunity(data: {
		communityId: string
		memberCedula: string
	}): Observable<any> {
		return this.http.post<any>(`${this.baseApi}/member/remove`, data)
	}
}

