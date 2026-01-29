import { Injectable, OnDestroy } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import * as signalR from '@microsoft/signalr'
import { HUB_URL } from '../conf/global'

export interface InvitationNotification {
	id: string
	communityId: string
	communityTitle: string
	communityDescription: string
	invitedByName: string
	invitedByCedula: string
	createdAt: string
}

@Injectable({
	providedIn: 'root',
})
export class NotificationService implements OnDestroy {
	private connection?: signalR.HubConnection
	private connectionStatus$ = new Subject<boolean>()
	private newInvitation$ = new Subject<InvitationNotification>()
	private invitationAccepted$ = new Subject<any>()
	private isConnecting = false
	private registeredCedula = ''

	constructor() {}

	/**
	 * Observable para nuevas invitaciones
	 */
	public onNewInvitation(): Observable<InvitationNotification> {
		return this.newInvitation$.asObservable()
	}

	/**
	 * Observable para invitaciones aceptadas
	 */
	public onInvitationAccepted(): Observable<any> {
		return this.invitationAccepted$.asObservable()
	}

	/**
	 * Observable para el estado de conexión
	 */
	public onConnectionStatus(): Observable<boolean> {
		return this.connectionStatus$.asObservable()
	}

	/**
	 * Conecta al hub de notificaciones y registra al usuario
	 */
	public async connect(cedula: string): Promise<void> {
		if (!cedula) {
			console.warn('[NotificationService] No se puede conectar sin cédula')
			return
		}

		// Si ya estamos conectados con la misma cédula, no reconectar
		if (
			this.registeredCedula === cedula &&
			this.connection?.state === signalR.HubConnectionState.Connected
		) {
			console.log('[NotificationService] Ya conectado con cédula:', cedula)
			return
		}

		// Si estamos conectando, esperar
		if (this.isConnecting) {
			console.log('[NotificationService] Conexión en progreso...')
			return
		}

		try {
			this.isConnecting = true

			// Si hay una conexión existente, desconectar primero
			if (this.connection) {
				await this.disconnect()
			}

			const token = sessionStorage.getItem('auth_token') || ''

			this.connection = new signalR.HubConnectionBuilder()
				.withUrl(HUB_URL, {
					accessTokenFactory: () => token,
				})
				.withAutomaticReconnect({
					nextRetryDelayInMilliseconds: () => 3000,
				})
				.configureLogging(signalR.LogLevel.Information)
				.build()

			this.setupEventHandlers()

			await this.connection.start()
			console.log('[NotificationService] Conectado al hub de notificaciones')
			this.connectionStatus$.next(true)

			// Registrar al usuario
			await this.connection.invoke('RegisterUser', cedula)
			this.registeredCedula = cedula
			console.log('[NotificationService] Usuario registrado:', cedula)
		} catch (err) {
			console.error('[NotificationService] Error al conectar:', err)
			this.connectionStatus$.next(false)
		} finally {
			this.isConnecting = false
		}
	}

	/**
	 * Configura los manejadores de eventos de SignalR
	 */
	private setupEventHandlers(): void {
		if (!this.connection) return

		// Recibir nuevas invitaciones
		this.connection.on('NewInvitation', (data: any) => {
			console.log('[NotificationService] Nueva invitación recibida:', data)

			const invitation: InvitationNotification = {
				id: data.Id || data.id,
				communityId: data.CommunityId || data.communityId,
				communityTitle: data.CommunityTitle || data.communityTitle,
				communityDescription: data.CommunityDescription || data.communityDescription,
				invitedByName: data.InvitedByName || data.invitedByName,
				invitedByCedula: data.InvitedByCedula || data.invitedByCedula,
				createdAt: data.CreatedAt || data.createdAt,
			}

			this.newInvitation$.next(invitation)
		})

		// Invitación aceptada
		this.connection.on('InvitationAccepted', (data: any) => {
			console.log('[NotificationService] Invitación aceptada:', data)
			this.invitationAccepted$.next(data)
		})

		// Confirmación de registro
		this.connection.on('Registered', (data: any) => {
			console.log('[NotificationService] Registro confirmado:', data)
		})

		// Errores
		this.connection.on('Error', (error: string) => {
			console.error('[NotificationService] Error del hub:', error)
		})

		// Reconexión
		this.connection.onreconnecting(() => {
			console.log('[NotificationService] Reconectando...')
			this.connectionStatus$.next(false)
		})

		this.connection.onreconnected(() => {
			console.log('[NotificationService] Reconectado')
			this.connectionStatus$.next(true)

			// Re-registrar al usuario
			if (this.registeredCedula) {
				this.connection?.invoke('RegisterUser', this.registeredCedula)
			}
		})

		this.connection.onclose(() => {
			console.log('[NotificationService] Conexión cerrada')
			this.connectionStatus$.next(false)
		})
	}

	/**
	 * Desconecta del hub
	 */
	public async disconnect(): Promise<void> {
		if (this.connection) {
			try {
				await this.connection.stop()
				console.log('[NotificationService] Desconectado')
			} catch (err) {
				console.error('[NotificationService] Error al desconectar:', err)
			}
			this.connection = undefined
			this.registeredCedula = ''
		}
		this.connectionStatus$.next(false)
	}

	ngOnDestroy(): void {
		this.disconnect()
		this.newInvitation$.complete()
		this.invitationAccepted$.complete()
		this.connectionStatus$.complete()
	}
}
