import { Component } from '@angular/core'
import { Router, RouterLink, RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { WebsocketService } from './services/websocket.service'

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
						<div class="text-right">
							<p class="text-sm font-medium text-gray-900">{{ currentUserName() }}</p>
							<p class="text-xs text-gray-500">Online</p>
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
			<div class="flex-1 overflow-hidden">
				<router-outlet></router-outlet>
			</div>
		</div>
	`,
})
export class AppComponent {
	title = 'WebSocket Demo'

	constructor(private router: Router, private ws: WebsocketService) {}

	isLogged(): boolean {
		return !!localStorage.getItem('user')
	}

	currentUserName(): string {
		try {
			const raw = localStorage.getItem('user')
			if (!raw) return ''
			const u = JSON.parse(raw)
			const name = [u?.name, u?.lastName].filter(Boolean).join(' ').trim()
			return name || u?.email || ''
		} catch {
			return ''
		}
	}

	logout() {
		try {
			this.ws.close()
		} catch {}
		localStorage.removeItem('auth_token')
		localStorage.removeItem('user')
		localStorage.removeItem('cedula')
		localStorage.removeItem('communityId')
		this.router.navigateByUrl('/login')
	}

	goHome() {
		if (this.isLogged()) {
			this.router.navigateByUrl('/dashboard')
		} else {
			this.router.navigateByUrl('/')
		}
	}
}
