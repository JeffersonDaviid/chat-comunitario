import { Component, OnInit, OnDestroy } from '@angular/core'
import { Router, RouterLink, RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { WebsocketService } from './services/websocket.service'
import { AuthService } from './services/auth.service'
import { ImageService } from './services/image.service'
import { Subscription } from 'rxjs'

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink],
	template: `
		<div class="h-screen flex flex-col bg-white">
			<!-- Header/Navbar -->
			<nav class="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-8">
						<a
							(click)="goHome()"
							class="text-2xl font-bold text-gray-900 hover:text-blue-600 transition cursor-pointer">
							Chat Comunitario
						</a>
					</div>
					<div
						class="flex items-center gap-4"
						*ngIf="isLogged()">
						<div class="flex items-center gap-3">
							<!-- Imagen de perfil con fallback -->
							<div class="relative">
								<img
									[src]="profileImageUrl"
									*ngIf="profileImageUrl"
									alt="Perfil"
									class="w-10 h-10 rounded-lg object-cover border-2 border-gray-200" />
								<div
									*ngIf="!profileImageUrl || imageError"
									class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200">
									{{ userInitial }}
								</div>
								<!-- Indicador de conexión WebSocket -->
								<div
									[class]="this.ws.status$() ? 'bg-green-500' : 'bg-red-500'"
									class="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"></div>
							</div>
							<div class="text-right">
								<p class="text-sm font-medium text-gray-900">{{ currentUserName() }}</p>
								<p class="text-xs text-gray-500">
									{{ this.ws.status$() ? 'Online' : 'Offline' }}
								</p>
							</div>
						</div>
						<button
							(click)="logout()"
							class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition">
							Logout
						</button>
					</div>
					<div
						class="flex gap-3"
						*ngIf="!isLogged()">
						<a
							routerLink="/login"
							class="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
							Login
						</a>
						<a
							routerLink="/register"
							class="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition">
							Register
						</a>
					</div>
				</div>
			</nav>

			<!-- Main Content -->
			<div class="flex-1 overflow-y-auto">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
})
export class AppComponent implements OnInit, OnDestroy {
	title = 'Chat Comunitario'
	profileImageUrl: string = ''
	userInitial: string = 'U'
	imageError: boolean = false
	wsConnected: boolean = false
	private wsSubscription!: Subscription
	private authSubscription!: Subscription

	constructor(
		private router: Router,
		protected ws: WebsocketService,
		protected authService: AuthService,
		protected imageService: ImageService,
	) {}

	ngOnInit() {
		// Suscribirse a cambios en el usuario autenticado
		this.authSubscription = this.authService.currentUser$.subscribe((user) => {
			this.updateUserInfo()
		})

		// Actualizar información inicial
		this.updateUserInfo()
	}

	ngOnDestroy() {
		if (this.wsSubscription) {
			this.wsSubscription.unsubscribe()
		}
		if (this.authSubscription) {
			this.authSubscription.unsubscribe()
		}
	}

	updateUserInfo() {
		const user = this.authService.getCurrentUser()
		if (user) {
			// Obtener inicial del usuario
			this.userInitial = this.getUserInitial(user)

			// Obtener URL de la imagen de perfil
			this.loadProfileImage(user.cedula)
		} else {
			this.profileImageUrl = ''
			this.userInitial = 'U'
			this.imageError = false
		}
	}

	private loadProfileImage(cedula: string) {
		this.imageService.getProfileImage(cedula).subscribe({
			next: (blob) => {
				// Crear URL a partir del blob
				const imageUrl = URL.createObjectURL(blob)
				this.profileImageUrl = imageUrl
			},
			error: (error) => {
				console.error('Error cargando imagen:', error)
				this.imageError = true
			},
		})
	}

	private getUserInitial(user: any): string {
		try {
			if (user?.name) {
				return user.name.charAt(0).toUpperCase()
			} else if (user?.email) {
				return user.email.charAt(0).toUpperCase()
			}
		} catch {
			// Ignorar error
		}
		return 'U'
	}

	isLogged(): boolean {
		return this.authService.isAuthenticated()
	}

	currentUserName(): string {
		const user = this.authService.getCurrentUser()
		if (user) {
			const name = [user?.name, user?.lastName].filter(Boolean).join(' ').trim()
			return name || user?.email || 'Usuario'
		}
		return ''
	}

	profileUrl(): string {
		// Método mantenido para compatibilidad
		return this.profileImageUrl
	}

	logout() {
		this.authService.logout().subscribe({
			next: () => {
				this.ws.close()
				this.router.navigateByUrl('/login')
			},
			error: (error) => {
				console.error('Error al cerrar sesión:', error)
				// Forzar logout local
				this.authService.clearSession()
				this.ws.close()
				this.router.navigateByUrl('/login')
			},
		})
	}

	goHome() {
		if (this.isLogged()) {
			this.router.navigateByUrl('/dashboard')
		} else {
			this.router.navigateByUrl('/')
		}
	}

	// Método para actualizar foto de perfil (opcional)
	updateProfileImage(event: any) {
		const file = event.target.files[0]
		if (file) {
			// Validar tipo de archivo
			const validTypes = [
				'image/jpeg',
				'image/jpg',
				'image/png',
				'image/gif',
				'image/webp',
			]
			if (!validTypes.includes(file.type)) {
				alert('Formato de imagen no válido. Use JPG, PNG, GIF o WebP.')
				return
			}

			// Validar tamaño (máximo 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('La imagen es demasiado grande. Máximo 5MB.')
				return
			}

			this.imageService.uploadProfileImage(file).subscribe({
				next: (response) => {
					if (response.success) {
						// Actualizar usuario localmente
						const user = this.authService.getCurrentUser()
						if (user) {
							user.profileImg = response.imageUrl
							this.authService.setSession(user, this.authService.getToken())
							this.loadProfileImage(user)
						}
						alert('Foto de perfil actualizada exitosamente')
					} else {
						alert('Error al actualizar foto: ' + response.message)
					}
				},
				error: (error) => {
					console.error('Error:', error)
					alert('Error al subir la imagen')
				},
			})
		}
	}
}
