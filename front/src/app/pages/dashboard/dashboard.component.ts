import { Component, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClientModule } from '@angular/common/http'
import { Router } from '@angular/router'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { Subscription } from 'rxjs'
import { CommunityService } from '../../services/community.service'
import { ChannelService } from '../../services/channel.service'
import { AuthService } from '../../services/auth.service'
import { NotificationService, InvitationNotification } from '../../services/notification.service'
import { InviteUsersModalComponent } from '../../components/invite-users-modal/invite-users-modal.component'
import { ChatComponent } from '../../components/chat/chat.component'

@Component({
	selector: 'app-dashboard',
	standalone: true,
	imports: [CommonModule, HttpClientModule, ReactiveFormsModule, InviteUsersModalComponent, ChatComponent],
	templateUrl: './dashboard.component.html',
	styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
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
		ownerCedula: string
		channels: any[]
	}> = []
	loading = false
	errorMsg = ''
	
	// Subscripciones para notificaciones en tiempo real
	private notificationSub?: Subscription

	// Chat integrado
	showChat = false
	activeCommunityId = ''
	activeChannelId = ''
	activeCommunityName = ''
	activeChannelName = ''

	// Modal states
	showCreateCommunityModal = false
	creatingCommunity = false
	createCommunityError = ''
	showInviteModal = false
	lastCreatedCommunityId = ''

	// Modal states para canales
	showCreateChannelModal = false
	creatingChannel = false
	createChannelError = ''
	selectedCommunityIdForChannel = ''

	// Invitaciones pendientes
	pendingInvitations: Array<{
		id: string
		communityId: string
		communityTitle: string
		communityDescription: string
		invitedByName: string
		invitedByCedula: string
		createdAt: string
	}> = []
	showInvitationsPanel = false
	processingInvitation = ''

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
		private readonly notification: NotificationService,
		private readonly router: Router,
		private readonly fb: FormBuilder
	) {}

	ngOnInit(): void {
		const u = this.auth.getCurrentUser()
		console.log('[Dashboard] Current user:', u)
		console.log('[Dashboard] User object keys:', u ? Object.keys(u) : 'null')
		console.log('[Dashboard] User cedula property:', u?.cedula)
		console.log('[Dashboard] User Cedula property:', u?.Cedula)
		
		if (u) {
			this.userName = [u?.name, u?.lastName].filter(Boolean).join(' ').trim()
			this.userEmail = u?.email || ''
			// Try both lowercase and uppercase property names
			this.userCedula = u?.cedula || u?.Cedula || ''
			this.userProfileImg = u?.profileImg || u?.ProfileImg || ''
		}

		console.log('[Dashboard] Final user cedula:', this.userCedula)
		console.log('[Dashboard] SessionStorage cedula:', sessionStorage.getItem('cedula'))

		if (!this.userCedula) {
			console.error('[Dashboard] No user cedula found, redirecting to login')
			// Protección adicional por si se accede directamente sin login
			this.router.navigateByUrl('/login')
			return
		}
		this.fetchCommunities()
		this.fetchPendingInvitations()
		this.setupNotificationListener()
	}

	ngOnDestroy(): void {
		this.notificationSub?.unsubscribe()
		this.notification.disconnect()
	}

	/**
	 * Configura el listener de notificaciones en tiempo real
	 */
	private setupNotificationListener(): void {
		// Conectar al hub de notificaciones
		this.notification.connect(this.userCedula)

		// Escuchar nuevas invitaciones
		this.notificationSub = this.notification.onNewInvitation().subscribe({
			next: (invitation) => {
				console.log('[Dashboard] Nueva invitación recibida en tiempo real:', invitation)
				
				// Añadir la invitación a la lista si no existe ya
				const exists = this.pendingInvitations.some(inv => inv.id === invitation.id)
				if (!exists) {
					this.pendingInvitations = [{
						id: invitation.id,
						communityId: invitation.communityId,
						communityTitle: invitation.communityTitle,
						communityDescription: invitation.communityDescription,
						invitedByName: invitation.invitedByName,
						invitedByCedula: invitation.invitedByCedula,
						createdAt: invitation.createdAt
					}, ...this.pendingInvitations]
					
					// Mostrar el panel de invitaciones automáticamente
					this.showInvitationsPanel = true
					console.log('[Dashboard] Panel de invitaciones mostrado automáticamente')
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error en notificación:', err)
			}
		})
	}

	profileUrl(): string {
		return this.auth.profileUrl(this.userProfileImg)
	}

	fetchCommunities() {
		this.loading = true
		console.log('[Dashboard] Fetching communities for cedula:', this.userCedula)
		
		this.community.getCommunitiesByUser(this.userCedula).subscribe({
			next: (res) => {
				console.log('[Dashboard] Communities response:', res)
				console.log('[Dashboard] Communities received:', res?.communities?.length || 0)
				
				// Solo actualizar si recibimos datos
				if (res?.communities) {
					this.communities = res.communities
					console.log('[Dashboard] Communities updated:', this.communities.length)
				}
				this.loading = false
			},
			error: (err) => {
				this.errorMsg = err?.error?.message || 'Error cargando comunidades'
				this.loading = false
			},
		})
	}

	goChannel(commId: string, channelId: string) {
		// Encontrar los nombres de la comunidad y canal
		const community = this.communities.find(c => c.id === commId)
		const channel = community?.channels?.find(ch => ch.id === channelId)
		
		this.activeCommunityId = commId
		this.activeChannelId = channelId
		this.activeCommunityName = community?.title || ''
		this.activeChannelName = channel?.name || ''
		this.showChat = true
		
		console.log('[Dashboard] Abriendo chat:', { commId, channelId, communityName: this.activeCommunityName, channelName: this.activeChannelName })
	}

	/**
	 * Abre el canal General de una comunidad (o el primer canal disponible)
	 */
	openGeneralChannel(community: any) {
		if (!community?.channels || community.channels.length === 0) {
			console.warn('[Dashboard] La comunidad no tiene canales')
			return
		}

		// Buscar el canal General (isGeneral = true) o el primero de la lista
		const generalChannel = community.channels.find((ch: any) => ch.isGeneral) || community.channels[0]
		
		if (generalChannel) {
			this.goChannel(community.id, generalChannel.id)
		}
	}

	closeChat() {
		this.showChat = false
		this.activeCommunityId = ''
		this.activeChannelId = ''
		this.activeCommunityName = ''
		this.activeChannelName = ''
	}

	isOwner(communityCedula: string): boolean {
		return this.userCedula === communityCedula
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

		// Verificar cedula antes de crear
		const currentUser = this.auth.getCurrentUser()
		const cedula = currentUser?.cedula || currentUser?.Cedula || sessionStorage.getItem('cedula') || ''
		
		console.log('[Dashboard] Current user before create:', currentUser)
		console.log('[Dashboard] Extracted cedula:', cedula)
		console.log('[Dashboard] this.userCedula value:', this.userCedula)
		console.log('[Dashboard] SessionStorage cedula:', sessionStorage.getItem('cedula'))

		const payload = {
			title: this.communityForm.get('title')?.value || '',
			description: this.communityForm.get('description')?.value || '',
			ownerCedula: cedula,
		}

		console.log('[Dashboard] Creating community with payload:', payload)
		console.log('[Dashboard] User cedula being used:', payload.ownerCedula)

		this.community.createCommunity(payload).subscribe({
			next: (res) => {
				console.log('[Dashboard] Create community response:', res)
				this.creatingCommunity = false
				
				if (res.success) {
					// Guardar ID de la comunidad creada
					this.lastCreatedCommunityId = res.community?.id || ''
					console.log('[Dashboard] Community created successfully with ID:', this.lastCreatedCommunityId)
					console.log('[Dashboard] Community owner cedula in response:', res.community?.ownerCedula)
					
					// NO agregar al array local, mejor refrescar directamente del backend
					this.closeCreateCommunityModal()
					
					// Refrescar comunidades del backend para obtener la nueva comunidad
					console.log('[Dashboard] Fetching updated communities from backend...')
					this.fetchCommunities()
					
					// Esperar a que carguen las comunidades antes de abrir modal
					setTimeout(() => {
						this.showInviteModal = true
					}, 500)
				} else {
					this.createCommunityError = res.message || 'Error al crear comunidad'
					console.error('[Dashboard] Error creating community:', res.message)
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error creating community:', err)
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

	deleteChannel(communityId: string, channelId: string, channelName: string) {
		if (!confirm(`¿Estás seguro de eliminar el canal #${channelName}?`)) {
			return
		}

		console.log('[Dashboard] Deleting channel:', channelId, 'from community:', communityId)
		
		this.channel.deleteChannel(communityId, channelId).subscribe({
			next: (res) => {
				console.log('[Dashboard] Delete channel response:', res)
				if (res.success) {
					// Eliminar el canal del array local
					const community = this.communities.find(c => c.id === communityId)
					if (community?.channels) {
						community.channels = community.channels.filter(ch => ch.id !== channelId)
						console.log('[Dashboard] Channel removed from local list')
					}
					
					// Si estamos viendo este canal, cerrar el chat
					if (this.activeChannelId === channelId) {
						this.closeChat()
					}
				} else {
					alert(res.message || 'Error al eliminar el canal')
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error deleting channel:', err)
				alert('Error al eliminar el canal')
			}
		})
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

		console.log('[Dashboard] Creating channel:', payload)

		this.channel.createChannel(payload).subscribe({
			next: (res) => {
				console.log('[Dashboard] Create channel response:', res)
				if (res.success) {
					console.log('[Dashboard] Channel created successfully')
					this.closeCreateChannelModal()
					// Refrescar comunidades para ver el nuevo canal
					this.fetchCommunities()
				} else {
					this.createChannelError = res.message || 'Error al crear canal'
				}
				this.creatingChannel = false
			},
			error: (err) => {
				console.error('[Dashboard] Error creating channel:', err)
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

	onInviteUsersSelected(selectedCedulas: string[]) {
		console.log('[Dashboard] Inviting users:', selectedCedulas)
		
		if (!this.lastCreatedCommunityId || selectedCedulas.length === 0) {
			console.log('[Dashboard] No users to invite, closing modal')
			this.showInviteModal = false
			// Ya se refrescó después de crear la comunidad, no necesitamos hacerlo de nuevo
			return
		}

		this.community.inviteUsers(this.lastCreatedCommunityId, selectedCedulas).subscribe({
			next: (res) => {
				console.log('[Dashboard] Invite users result:', res)
				this.showInviteModal = false
				// Refrescar para ver los nuevos miembros
				this.fetchCommunities()
			},
			error: (err) => {
				console.error('[Dashboard] Error inviting users:', err)
				this.showInviteModal = false
				this.fetchCommunities()
			},
		})
	}

	closeInviteModal() {
		this.showInviteModal = false
		this.lastCreatedCommunityId = ''
		// Refrescar solo si realmente invitamos usuarios
		console.log('[Dashboard] Invite modal closed, refreshing communities from backend...')
		this.fetchCommunities()
	}

	// ==================== INVITACIONES ====================

	fetchPendingInvitations() {
		console.log('[Dashboard] Fetching pending invitations for:', this.userCedula)
		this.community.getPendingInvitations(this.userCedula).subscribe({
			next: (res) => {
				console.log('[Dashboard] Pending invitations response:', res)
				if (res?.invitations) {
					// Filtrar invitaciones que tengan un ID válido
					this.pendingInvitations = res.invitations.filter((inv: any) => 
						inv.id && inv.id !== '' && inv.id !== 'null' && inv.id !== 'undefined'
					)
					console.log('[Dashboard] Filtered pending invitations:', this.pendingInvitations)
				} else {
					this.pendingInvitations = []
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error fetching invitations:', err)
				this.pendingInvitations = []
			}
		})
	}

	toggleInvitationsPanel() {
		this.showInvitationsPanel = !this.showInvitationsPanel
	}

	acceptInvitation(invitation: any) {
		console.log('[Dashboard] Accepting invitation - full object:', invitation)
		console.log('[Dashboard] Invitation ID:', invitation.id)
		console.log('[Dashboard] Invitation ID type:', typeof invitation.id)
		
		if (!invitation.id) {
			console.error('[Dashboard] Invalid invitation ID!')
			return
		}
		
		this.processingInvitation = invitation.id
		
		this.community.acceptInvitation(invitation.id, this.userCedula).subscribe({
			next: (res) => {
				console.log('[Dashboard] Accept invitation result:', res)
				this.processingInvitation = ''
				if (res.success) {
					// Remover de la lista local
					this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== invitation.id)
					// Refrescar comunidades
					this.fetchCommunities()
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error accepting invitation:', err)
				this.processingInvitation = ''
			}
		})
	}

	rejectInvitation(invitation: any) {
		console.log('[Dashboard] Rejecting invitation - full object:', invitation)
		console.log('[Dashboard] Invitation ID:', invitation.id)
		
		if (!invitation.id) {
			console.error('[Dashboard] Invalid invitation ID!')
			return
		}
		
		this.processingInvitation = invitation.id
		
		this.community.rejectInvitation(invitation.id, this.userCedula).subscribe({
			next: (res) => {
				console.log('[Dashboard] Reject invitation result:', res)
				this.processingInvitation = ''
				if (res.success) {
					// Remover de la lista local
					this.pendingInvitations = this.pendingInvitations.filter(i => i.id !== invitation.id)
				}
			},
			error: (err) => {
				console.error('[Dashboard] Error rejecting invitation:', err)
				this.processingInvitation = ''
			}
		})
	}

	get f() {
		return this.communityForm.controls
	}

	get fc() {
		return this.channelForm.controls
	}
}
