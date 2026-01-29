import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { BehaviorSubject, Observable, tap } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { apiBaseUrl, baseFiles } from '../conf/global'

@Injectable({ providedIn: 'root' })
export class AuthService {
	private healthCheckInterval?: any

	private currentUserSubject = new BehaviorSubject<any>(null)
	public currentUser$ = this.currentUserSubject.asObservable()

	private tokenSubject = new BehaviorSubject<string>('')
	public token$ = this.tokenSubject.asObservable()

	constructor(private http: HttpClient) {
		this.loadSession()
		this.startHealthCheck()
	}

	login(email: string, password: string): Observable<any> {
		const loginData = { email, password }

		return this.http.post(`${apiBaseUrl}/auth/login`, loginData).pipe(
			map((response: any) => {
				console.log('REST Response:', response)

				const { success, token, user, message } = response

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
			}),
			catchError((error) => {
				console.error('Login error:', error)
				throw error
			}),
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
		file?: File | null,
	): Observable<any> {
		// Convertir imagen a Base64 si existe
		if (file) {
			return new Observable((observer) => {
				const reader = new FileReader()

				reader.onload = () => {
					const base64 = reader.result as string
					const extension = this.getFileExtension(file.name)

					// Crear objeto con datos e imagen en Base64
					const requestData = {
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
						profileImg: base64, // Enviar la imagen en Base64
					}

					this.http
						.post(`${apiBaseUrl}/auth/register`, requestData)
						.pipe(
							map((response: any) => this.parseRegisterResponse(response)),
							tap((res) => {
								if (res.success && res.user) {
									this.setSession(res.user, res.token)
								}
							}),
							catchError((error) => {
								console.error('Register error:', error)
								throw error
							}),
						)
						.subscribe({
							next: (result) => observer.next(result),
							error: (err) => observer.error(err),
							complete: () => observer.complete(),
						})
				}

				reader.onerror = () => {
					observer.error('Error leyendo el archivo')
				}

				reader.readAsDataURL(file)
			})
		}

		// Sin imagen
		return this.http.post(`${apiBaseUrl}/auth/register`, data).pipe(
			map((response: any) => this.parseRegisterResponse(response)),
			tap((res) => {
				if (res.success && res.user) {
					this.setSession(res.user, res.token)
				}
			}),
			catchError((error) => {
				console.error('Register error:', error)
				throw error
			}),
		)
	}

	private parseRegisterResponse(response: any): any {
		console.log('Register Response:', response)

		const { success, token, user, message } = response

		if (!success) {
			throw new Error(message || 'Error en el registro')
		}

		return { success, token, user, message }
	}

	private getFileExtension(filename: string): string {
		const parts = filename.split('.')
		return parts.length > 1 ? `.${parts[parts.length - 1]}` : '.jpg'
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
		this.http.get(`${baseFiles}/`, { responseType: 'text' }).subscribe({
			next: () => {
				// Backend disponible, todo bien
				console.log('[Auth] Backend está disponible')
			},
			error: (err) => {
				console.warn('[Auth] Backend no disponible, cerrando sesión...', err)
				// Backend caído, limpiar sesión
				this.clearSession()
				// Recargar página para forzar redirect a login
				window.location.reload()
			},
		})
	}

	profileUrl(img: string | null | undefined): string {
		const src = (img || '').trim()
		if (!src) return ''
		if (src.startsWith('http')) return src
		if (src.startsWith('data:')) return src
		return `${baseFiles}${src.startsWith('/') ? src : '/' + src}`
	}

	// Método para verificar token (opcional)
	verifyToken(): Observable<any> {
		const token = this.getToken()
		if (!token) {
			return new Observable((observer) => {
				observer.error('No token available')
				observer.complete()
			})
		}

		return this.http.post(`${apiBaseUrl}/auth/verify-token`, { token }).pipe(
			catchError((error) => {
				console.error('Token verification failed:', error)
				// Si el token no es válido, cerrar sesión
				this.clearSession()
				throw error
			}),
		)
	}

	setSession(user: any, token: string) {
		try {
			// Normalizar propiedades del usuario (backend envía con mayúscula)
			const normalizedUser = {
				cedula: user?.Cedula || user?.cedula,
				name: user?.Name || user?.name,
				lastName: user?.LastName || user?.lastName,
				email: user?.Email || user?.email,
				profileImg: user?.ProfileImg || user?.profileImg,
			}

			console.log('[Auth] Setting session with user:', normalizedUser)

			if (token) sessionStorage.setItem('auth_token', token)
			if (normalizedUser) sessionStorage.setItem('user', JSON.stringify(normalizedUser))
			if (normalizedUser?.cedula) sessionStorage.setItem('cedula', normalizedUser.cedula)

			// Actualizar subjects con usuario normalizado
			this.currentUserSubject.next(normalizedUser)
			this.tokenSubject.next(token)

			this.startHealthCheck()
		} catch (error) {
			console.error('Error setting session:', error)
		}
	}

	clearSession() {
		try {
			sessionStorage.removeItem('auth_token')
			sessionStorage.removeItem('user')
			sessionStorage.removeItem('cedula')
			sessionStorage.removeItem('communityId')

			// Actualizar subjects
			this.currentUserSubject.next(null)
			this.tokenSubject.next('')

			this.stopHealthCheck()
		} catch (error) {
			console.error('Error clearing session:', error)
		}
	}

	private loadSession() {
		try {
			const userStr = sessionStorage.getItem('user')
			const token = sessionStorage.getItem('auth_token')

			if (userStr && token) {
				const user = JSON.parse(userStr)
				this.currentUserSubject.next(user)
				this.tokenSubject.next(token)
			}
		} catch (error) {
			this.clearSession()
		}
	}

	getCurrentUser(): any {
		return this.currentUserSubject.value
	}

	getToken(): string {
		return this.tokenSubject.value
	}

	isAuthenticated(): boolean {
		return !!this.getToken()
	}

	// Método logout que retorna Observable
	logout(): Observable<any> {
		return new Observable((observer) => {
			try {
				this.clearSession()
				observer.next({ success: true, message: 'Sesión cerrada exitosamente' })
				observer.complete()
			} catch (error) {
				observer.error(error)
			}
		})
	}
}
