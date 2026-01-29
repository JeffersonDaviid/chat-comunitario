import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { apiBaseUrl } from '../conf/global'

@Injectable({ providedIn: 'root' })
export class ImageService {
	constructor(private http: HttpClient) {}

	// Obtener imagen de perfil por cédula
	getProfileImage(cedula: string): Observable<Blob> {
		return this.http.get(`${apiBaseUrl}/images/profile/${cedula}`, {
			responseType: 'blob', // ¡IMPORTANTE! Esto le dice a Angular que espera un blob, no JSON
		})
	}

	// Subir nueva imagen de perfil
	uploadProfileImage(file: File): Observable<any> {
		const formData = new FormData()
		formData.append('file', file)

		return this.http.post(`${apiBaseUrl}/images/upload-profile`, formData)
	}

	// Generar URL para avatar por defecto
	getDefaultAvatarUrl(name: string): string {
		const initial = name ? name.charAt(0).toUpperCase() : 'U'
		// Puedes usar un servicio como DiceBear o crear tu propio avatar
		return `https://ui-avatars.com/api/?name=${initial}&background=3B82F6&color=fff&bold=true`
	}
}
