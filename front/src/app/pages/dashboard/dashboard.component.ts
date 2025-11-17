import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { Router } from '@angular/router'
import { CommunityService } from '../../services/community.service'
import { AuthService } from '../../services/auth.service'

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule, HttpClientModule],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
	userName = ''
	userEmail = ''
	userCedula = ''
	userProfileImg = ''
	communities: Array<{
		id: string
		title: string
		description: string
		channels: any[]
	}> = []
	loading = false
	errorMsg = ''

	constructor(
		private community: CommunityService,
		private auth: AuthService,
		private router: Router
	) {}

	ngOnInit(): void {
		const u = this.auth.getCurrentUser<any>()
		if (u) {
			this.userName = [u?.name, u?.lastName].filter(Boolean).join(' ').trim()
			this.userEmail = u?.email || ''
			this.userCedula = u?.cedula || ''
			this.userProfileImg = u?.profileImg || ''
		}

		if (!this.userCedula) {
			// Protección adicional por si se accede directamente sin login
			this.router.navigateByUrl('/login')
			return
		}
		this.fetchCommunities()
	}

	profileUrl(): string {
		return this.auth.profileUrl(this.userProfileImg)
	}

	fetchCommunities() {
		this.loading = true
		this.community.getCommunities(this.userCedula).subscribe({
			next: (res) => {
				this.communities = res?.communities || []
				this.loading = false
			},
			error: (err) => {
				this.errorMsg = err?.error?.message || 'Error cargando comunidades'
				this.loading = false
			},
		})
	}

	goChannel(commId: string, channelId: string) {
		this.router.navigate(['/chat', commId, channelId])
	}
}
