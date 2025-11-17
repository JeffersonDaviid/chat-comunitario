import { Component } from '@angular/core'
import { Router, RouterLink, RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { WebsocketService } from './services/websocket.service'

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterOutlet, RouterLink],
	template: `
		<div class="h-screen bg-gray-50">
			<nav class="p-4 flex items-center justify-between bg-white shadow-sm">
				<div class="flex gap-4">
					<a
						routerLink="/"
						class="text-blue-600"
						>WS Demo</a
					>
					<a
						routerLink="/dashboard"
						class="text-blue-600"
						>Dashboard</a
					>
					<a
						routerLink="/login"
						class="text-blue-600"
						>Login</a
					>
					<a
						routerLink="/register"
						class="text-blue-600"
						>Register</a
					>
				</div>
				<div
					class="flex items-center gap-3"
					*ngIf="isLogged()">
					<span class="text-sm text-gray-700">{{ currentUserName() }}</span>
					<button
						(click)="logout()"
						class="px-3 py-1.5 text-sm bg-red-600 text-white rounded">
						Logout
					</button>
				</div>
			</nav>
			<router-outlet></router-outlet>
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
}
