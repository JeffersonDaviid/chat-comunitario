import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { Router } from '@angular/router'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { CommunityService } from '../../services/community.service'
import { ChannelService } from '../../services/channel.service'
import { AuthService } from '../../services/auth.service'

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
	userName = ''
	userEmail = ''
	userCedula = ''
	userProfileImg = ''
	sidebarExpanded = false
	sidebarHovered = false
	sidebarPinned = false
	communities: Array<{
		id: string
		title: string
		description: string
		channels: any[]
	}> = []
	loading = false
	errorMsg = ''

	// Modal states
	showCreateCommunityModal = false
	creatingCommunity = false
	createCommunityError = ''

	// Modal states para canales
	showCreateChannelModal = false
	creatingChannel = false
	createChannelError = ''
	selectedCommunityIdForChannel = ''

	// Form
	communityForm = this.fb.group({
		title: ['', [Validators.required, Validators.minLength(3)]],
		description: ['', [Validators.required, Validators.minLength(10)]],
	})

	channelForm = this.fb.group({
		name: ['', [Validators.required, Validators.minLength(2)]],
		description: ['', [Validators.required, Validators.minLength(5)]],
	})

	constructor(
		private readonly community: CommunityService,
		private readonly channel: ChannelService,
		private readonly auth: AuthService,
		private readonly router: Router,
		private readonly fb: FormBuilder
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
		this.community.getCommunitiesByUser(this.userCedula).subscribe({
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

	// Sidebar actions
	addNewCommunity() {
		this.showCreateCommunityModal = true
		this.createCommunityError = ''
	}

	closeCreateCommunityModal() {
		this.showCreateCommunityModal = false
		this.communityForm.reset()
		this.createCommunityError = ''
		this.creatingCommunity = false
	}

	submitCreateCommunity() {
		if (this.communityForm.invalid) {
			this.communityForm.markAllAsTouched()
			return
		}

		this.creatingCommunity = true
		this.createCommunityError = ''

		const payload = {
			title: this.communityForm.get('title')?.value || '',
			description: this.communityForm.get('description')?.value || '',
			ownerCedula: this.userCedula,
		}

		this.community.createCommunity(payload).subscribe({
			next: (res) => {
				if (res.success) {
					this.closeCreateCommunityModal()
					this.fetchCommunities()
				} else {
					this.createCommunityError = res.message || 'Error al crear comunidad'
				}
				this.creatingCommunity = false
			},
			error: (err) => {
				this.createCommunityError =
					err?.error?.message || 'Error al crear comunidad'
				this.creatingCommunity = false
			},
		})
	}

	sendNewMessage() {
		console.log('Enviar nuevo mensaje')
		// Será implementado en futuras versiones
	}

	createNewChannel(communityId?: string) {
		if (!communityId) {
			return
		}
		this.selectedCommunityIdForChannel = communityId
		this.showCreateChannelModal = true
		this.createChannelError = ''
		this.channelForm.reset()
	}

	goHome() {
		this.router.navigateByUrl('/')
	}

	viewContacts() {
		console.log('Ver contactos')
		// Será implementado en futuras versiones
	}

	viewSaved() {
		console.log('Ver guardados')
		// Será implementado en futuras versiones
	}

	viewHistory() {
		console.log('Ver historial')
		// Será implementado en futuras versiones
	}

	logout() {
		localStorage.removeItem('auth_token')
		localStorage.removeItem('user')
		localStorage.removeItem('cedula')
		localStorage.removeItem('communityId')
		this.router.navigateByUrl('/login')
	}

	toggleSidebar() {
		this.sidebarExpanded = !this.sidebarExpanded
	}

	closeCreateChannelModal() {
		this.showCreateChannelModal = false
		this.channelForm.reset()
		this.createChannelError = ''
		this.creatingChannel = false
		this.selectedCommunityIdForChannel = ''
	}

	submitCreateChannel() {
		if (this.channelForm.invalid) {
			this.channelForm.markAllAsTouched()
			return
		}

		this.creatingChannel = true
		this.createChannelError = ''

		const payload = {
			communityId: this.selectedCommunityIdForChannel,
			name: this.channelForm.get('name')?.value || '',
			description: this.channelForm.get('description')?.value || '',
		}

		this.channel.createChannel(payload).subscribe({
			next: (res) => {
				if (res.success) {
					this.closeCreateChannelModal()
					this.fetchCommunities()
				} else {
					this.createChannelError = res.message || 'Error al crear canal'
				}
				this.creatingChannel = false
			},
			error: (err) => {
				this.createChannelError = err?.error?.message || 'Error al crear canal'
				this.creatingChannel = false
			},
		})
	}

	expandSidebar() {
		if (!this.sidebarPinned) {
			this.sidebarHovered = true
			this.sidebarExpanded = true
		}
	}

	collapseSidebar() {
		if (!this.sidebarPinned) {
			this.sidebarHovered = false
			this.sidebarExpanded = false
		}
	}

	toggleSidebarPin() {
		this.sidebarPinned = !this.sidebarPinned
		if (this.sidebarPinned) {
			this.sidebarExpanded = true
		} else {
			this.sidebarExpanded = false
		}
	}

	get f() {
		return this.communityForm.controls
	}

	get fc() {
		return this.channelForm.controls
	}
}
