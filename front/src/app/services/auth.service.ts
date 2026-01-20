import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'
import { map } from 'rxjs/operators'
import { SoapClientService } from './soap-client.service'

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly authServiceUrl = 'http://localhost:5000/AuthService.svc'
	private readonly baseFiles = 'http://localhost:5000'
	private healthCheckInterval?: any

	constructor(
		private http: HttpClient,
		private soap: SoapClientService
	) {
		this.startHealthCheck()
	}

	login(email: string, password: string): Observable<any> {
		const requestBody = this.soap.buildRequestBody({ email, password })
		
		return this.soap.call(this.authServiceUrl, 'Login', requestBody).pipe(
			map((soapResponse) => {
				console.log('SOAP Response:', soapResponse)
				
				// Extraer datos de la respuesta SOAP
				const result = soapResponse?.LoginResult || soapResponse
				console.log('LoginResult:', result)
				
				// Extraer valores (pueden venir como string directo o como objeto con #text)
				const successValue = result?.Success?.['#text'] || result?.Success || 'false'
				const success = successValue === true || successValue === 'true' || successValue === 'True'
				const token = result?.Token?.['#text'] || result?.Token || ''
				const message = result?.Message?.['#text'] || result?.Message || ''
				
				// Extraer usuario
				const userNode = result?.User || {}
				const user = {
					cedula: userNode?.Cedula?.['#text'] || userNode?.Cedula || '',
					name: userNode?.Name?.['#text'] || userNode?.Name || '',
					lastName: userNode?.LastName?.['#text'] || userNode?.LastName || '',
					email: userNode?.Email?.['#text'] || userNode?.Email || '',
					phone: userNode?.Phone?.['#text'] || userNode?.Phone || '',
					address: userNode?.Address?.['#text'] || userNode?.Address || '',
					profileImg: userNode?.ProfileImg?.['#text'] || userNode?.ProfileImg || null
				}

				console.log('Parsed result:', { success, token, user, message })
				
				// Validar si el login fue exitoso
				if (!success) {
					throw new Error(message || 'Credenciales inválidas')
				}
				
				return { success, token, user, message }
			}),
			tap((res) => {
				console.log('Tap result:', res)
				if (res.success && res.user) {
					this.setSession(res.user, res.token)
				}
			})
		)
	}

	register(
		data: {
			cedula: string
			name: string
			lastName: string
			email: string
			password: string
			confirmPassword: string
			phone: string
			address: string
			latitude: number
			longitude: number
		},
		file?: File | null
	): Observable<any> {
		// Convertir imagen a Base64 si existe
		if (file) {
			return new Observable((observer) => {
				const reader = new FileReader()
				
				reader.onload = () => {
					const base64 = reader.result as string
					const extension = this.getFileExtension(file.name)
					
					// Construir request SOAP con imagen Base64
					const requestBody = this.soap.buildRequestBody({
						cedula: data.cedula,
						name: data.name,
						lastName: data.lastName,
						email: data.email,
						password: data.password,
						confirmPassword: data.confirmPassword,
						phone: data.phone,
						address: data.address,
						latitude: data.latitude,
						longitude: data.longitude,
						profilePictureBase64: base64,
						profilePictureExtension: extension
					})

					this.soap.call(this.authServiceUrl, 'Register', requestBody).pipe(
						map((soapResponse) => this.parseRegisterResponse(soapResponse)),
						tap((res) => {
							if (res.success && res.user) {
								this.setSession(res.user, res.token)
							}
						})
					).subscribe({
						next: (result) => observer.next(result),
						error: (err) => observer.error(err),
						complete: () => observer.complete()
					})
				}

				reader.onerror = () => {
					observer.error('Error leyendo el archivo')
				}

				reader.readAsDataURL(file)
			})
		}

		// Sin imagen
		const requestBody = this.soap.buildRequestBody({
			cedula: data.cedula,
			name: data.name,
			lastName: data.lastName,
			email: data.email,
			password: data.password,
			confirmPassword: data.confirmPassword,
			phone: data.phone,
			address: data.address,
			latitude: data.latitude,
			longitude: data.longitude
		})

		return this.soap.call(this.authServiceUrl, 'Register', requestBody).pipe(
			map((soapResponse) => this.parseRegisterResponse(soapResponse)),
			tap((res) => {
				if (res.success && res.user) {
					this.setSession(res.user, res.token)
				}
			})
		)
	}

	private parseRegisterResponse(soapResponse: any): any {
		const result = soapResponse?.RegisterResult || soapResponse
		const successValue = result?.Success?.['#text'] || result?.Success || 'false'
		const success = successValue === true || successValue === 'true' || successValue === 'True'
		const token = result?.Token?.['#text'] || result?.Token || ''
		const message = result?.Message?.['#text'] || result?.Message || ''
		
		const userNode = result?.User || {}
		const user = {
			cedula: userNode?.Cedula?.['#text'] || userNode?.Cedula || '',
			name: userNode?.Name?.['#text'] || userNode?.Name || '',
			lastName: userNode?.LastName?.['#text'] || userNode?.LastName || '',
			email: userNode?.Email?.['#text'] || userNode?.Email || '',
			phone: userNode?.Phone?.['#text'] || userNode?.Phone || '',
			address: userNode?.Address?.['#text'] || userNode?.Address || '',
			profileImg: userNode?.ProfileImg?.['#text'] || userNode?.ProfileImg || null
		}

		return { success, token, user, message }
	}

	private getFileExtension(filename: string): string {
		const parts = filename.split('.')
		return parts.length > 1 ? `.${parts[parts.length - 1]}` : '.jpg'
	}

	setSession(user: any, token: string) {
		try {
			// Usar sessionStorage en vez de localStorage para que la sesión no persista al cerrar navegador
			if (token) sessionStorage.setItem('auth_token', token)
			if (user) sessionStorage.setItem('user', JSON.stringify(user))
			if (user?.cedula) sessionStorage.setItem('cedula', user.cedula)
			// Reiniciar health check al iniciar sesión
			this.startHealthCheck()
		} catch {}
	}

	clearSession() {
		try {
			sessionStorage.removeItem('auth_token')
			sessionStorage.removeItem('user')
			sessionStorage.removeItem('cedula')
			sessionStorage.removeItem('communityId')
			// Detener health check al cerrar sesión
			this.stopHealthCheck()
		} catch {}
	}

	getCurrentUser<T = any>(): T | null {
		try {
			const raw = sessionStorage.getItem('user')
			return raw ? (JSON.parse(raw) as T) : null
		} catch {
			return null
		}
	}

	getToken(): string {
		try {
			return sessionStorage.getItem('auth_token') || ''
		} catch {
			return ''
		}
	}

	/**
	 * Inicia verificación periódica de salud del backend
	 */
	private startHealthCheck() {
		// Limpiar intervalo previo si existe
		this.stopHealthCheck()

		// Solo hacer health check si hay token (usuario autenticado)
		if (!this.getToken()) return

		// Verificar cada 10 segundos
		this.healthCheckInterval = setInterval(() => {
			this.checkBackendHealth()
		}, 10000)
	}

	/**
	 * Detiene la verificación de salud del backend
	 */
	private stopHealthCheck() {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval)
			this.healthCheckInterval = undefined
		}
	}

	/**
	 * Verifica si el backend está disponible
	 */
	private checkBackendHealth() {
		if (!this.getToken()) {
			this.stopHealthCheck()
			return
		}

		// Hacer petición simple al backend
		this.http.get(`${this.baseFiles}/`, { responseType: 'text' })
			.subscribe({
				error: (err) => {
					console.warn('[Auth] Backend no disponible, cerrando sesión...', err)
					// Backend caído, limpiar sesión
					this.clearSession()
					// Recargar página para forzar redirect a login
					window.location.reload()
				}
			})
	}

	profileUrl(img: string | null | undefined): string {
		const src = (img || '').trim()
		if (!src) return ''
		if (src.startsWith('http')) return src
		if (src.startsWith('data:')) return src
		return `${this.baseFiles}${src.startsWith('/') ? src : '/' + src}`
	}
}
