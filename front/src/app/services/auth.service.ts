import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class AuthService {
	private readonly baseAuth = 'http://localhost:3000/api/auth'
	private readonly baseFiles = 'http://localhost:3000'

	constructor(private http: HttpClient) {}

	login(email: string, password: string): Observable<any> {
		const payload = { email, password }
		return this.http.post<any>(`${this.baseAuth}/login`, payload).pipe(
			tap((res) => {
				const user = res?.data?.user || res?.user || null
				const token = res?.data?.token || res?.token || ''
				if (user) {
					this.setSession(user, token)
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
		const formData = new FormData()
		formData.append('cedula', data.cedula || '')
		formData.append('name', data.name || '')
		formData.append('lastName', data.lastName || '')
		formData.append('email', data.email || '')
		formData.append('password', data.password || '')
		formData.append('confirmPassword', data.confirmPassword || '')
		formData.append('phone', data.phone || '')
		formData.append('address', data.address || '')
		formData.append('latitude', data.latitude.toString())
		formData.append('longitude', data.longitude.toString())
		if (file) {
			formData.append('profile', file, file.name)
		}
		return this.http.post<any>(`${this.baseAuth}/register`, formData)
	}

	setSession(user: any, token: string) {
		try {
			if (token) localStorage.setItem('auth_token', token)
			if (user) localStorage.setItem('user', JSON.stringify(user))
			if (user?.cedula) localStorage.setItem('cedula', user.cedula)
		} catch {}
	}

	clearSession() {
		try {
			localStorage.removeItem('auth_token')
			localStorage.removeItem('user')
			localStorage.removeItem('cedula')
		} catch {}
	}

	getCurrentUser<T = any>(): T | null {
		try {
			const raw = localStorage.getItem('user')
			return raw ? (JSON.parse(raw) as T) : null
		} catch {
			return null
		}
	}

	getToken(): string {
		try {
			return localStorage.getItem('auth_token') || ''
		} catch {
			return ''
		}
	}

	profileUrl(img: string | null | undefined): string {
		const src = (img || '').trim()
		if (!src) return ''
		if (src.startsWith('http')) return src
		if (src.startsWith('data:')) return src
		return `${this.baseFiles}${src.startsWith('/') ? src : '/' + src}`
	}
}
