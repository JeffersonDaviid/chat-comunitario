import { Injectable, OnDestroy } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import * as signalR from '@microsoft/signalr'

// Interfaz para el mensaje que se envía/recibe
export interface WSMessage {
    type?: string
    messageType?: string
    payload?: any
}

// Interfaz para los parámetros de conexión
export interface WSConnectParams {
    communityId: string
    cedula: string
    channelId?: string
}

@Injectable({
    providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
    // Base URL for SignalR Hub
    private HUB_URL = 'http://localhost:5000/ws'
    private connection?: signalR.HubConnection
    private connectionStatus$ = new Subject<boolean>()
    private incoming$ = new Subject<WSMessage>()
    private lastParams?: WSConnectParams
    private isConnecting = false

    // Exposes incoming messages as an Observable
    public messages$(): Observable<WSMessage> {
        return this.incoming$.asObservable()
    }

    // Exposes the connection status as an Observable
    public status$(): Observable<boolean> {
        return this.connectionStatus$.asObservable()
    }

    constructor() {
        this.initializeConnection()
    }

    /**
     * Inicializa la conexión SignalR
     */
    private initializeConnection() {
		const token = sessionStorage.getItem('auth_token') || ''
		
		this.connection = new signalR.HubConnectionBuilder()
			.withUrl(this.HUB_URL, {
				accessTokenFactory: () => token
			})
			.withAutomaticReconnect({
				nextRetryDelayInMilliseconds: () => 3000
			})
			.configureLogging(signalR.LogLevel.Information)
			.build()

        // Configurar event handlers
        this.setupEventHandlers()
    }

    /**
     * Configura los manejadores de eventos de SignalR
     */
    private setupEventHandlers() {
        if (!this.connection) return

        // Recibir mensajes
        this.connection.on('ReceiveMessage', (message: any) => {
            console.log('[SignalR] Mensaje recibido:', message)
            
            // Normalizar mensaje
            const normalized: WSMessage = {
                type: message.type || 'chat',
                messageType: message.type,
                payload: message.payload || message
            }

            // Map ISO timestamp to payload.ts number if it exists
            const iso = message?.timestamp || message?.payload?.timestamp
            if (iso && typeof normalized.payload === 'object' && normalized.payload) {
                (normalized.payload as any).ts = Date.parse(iso)
            }

            this.incoming$.next(normalized)
        })

        // Manejar errores
        this.connection.on('Error', (error: string) => {
            console.error('[SignalR] Error:', error)
        })

        // Evento de reconexión
        this.connection.onreconnecting(() => {
            console.log('[SignalR] Reconectando...')
            this.connectionStatus$.next(false)
        })

        // Evento de reconexión exitosa
        this.connection.onreconnected(() => {
            console.log('[SignalR] Reconectado exitosamente')
            this.connectionStatus$.next(true)
            
            // Re-unirse al canal si había uno activo
            if (this.lastParams) {
                this.joinChannel(this.lastParams)
            }
        })

        // Evento de cierre
		this.connection.onclose((error) => {
			console.log('[SignalR] Conexión cerrada', error)
			this.connectionStatus$.next(false)
			
			// Si hay error y el usuario tiene sesión, podria ser backend caído
			if (error && sessionStorage.getItem('auth_token')) {
				console.warn('[SignalR] Backend posiblemente caído')
			}
		})
    }

    /**
     * Conecta al servidor SignalR
     */
    private async connect(): Promise<void> {
        if (!this.connection) {
            this.initializeConnection()
        }

        if (this.connection?.state === signalR.HubConnectionState.Connected) {
            console.log('[SignalR] Ya está conectado')
            return
        }

        if (this.isConnecting) {
            console.log('[SignalR] Conexión en progreso...')
            return
        }

        try {
            this.isConnecting = true
            await this.connection?.start()
            console.log('[SignalR] Conectado exitosamente')
            this.connectionStatus$.next(true)
        } catch (err) {
            console.error('[SignalR] Error al conectar:', err)
            this.connectionStatus$.next(false)
            
            // Reintentar después de un delay
            setTimeout(() => this.connect(), 3000)
        } finally {
            this.isConnecting = false
        }
    }

    /**
     * Une al usuario a un canal específico
     */
    private async joinChannel(params: WSConnectParams): Promise<void> {
        if (!this.connection) return

        try {
            await this.connection.invoke(
                'JoinChannel',
                params.communityId,
                params.channelId || '',
                params.cedula
            )
            console.log(`[SignalR] Unido al canal ${params.channelId} en comunidad ${params.communityId}`)
        } catch (err) {
            console.error('[SignalR] Error al unirse al canal:', err)
        }
    }

    /**
     * Establece la identidad del usuario y se conecta
     */
    public async setIdentity(params: WSConnectParams, reconnect = true): Promise<void> {
        this.lastParams = params
		sessionStorage.setItem('communityId', params.communityId)
		sessionStorage.setItem('cedula', params.cedula)

		if (reconnect) {
			// Conectar si no está conectado
			if (this.connection?.state !== signalR.HubConnectionState.Connected) {
				await this.connect()
			}

			// Unirse al canal
			await this.joinChannel(params)
			
			// Emitir que estamos conectados DESPUÉS de unirse al canal
			console.log('[SignalR] Usuario unido al canal, emitiendo estado conectado')
			this.connectionStatus$.next(true)
		}
    }

    /**
     * Envía un mensaje de texto simple
     */
    public async sendText(text: string): Promise<void> {
        await this.sendMessage(text)
    }

    /**
     * Envía un mensaje al canal actual
     */
    public async sendChannelMessage(channelId: string, content: string | any): Promise<void> {
        let textContent = ''
        let fileData: string | undefined = undefined
        let fileType: string | undefined = undefined
        let fileName: string | undefined = undefined

        if (typeof content === 'string') {
            textContent = content
        } else {
            textContent = content.text || content.content || ''
            
            // Extraer fileData, fileType y fileName del objeto file si existe
            if (content.file) {
                if (typeof content.file === 'string') {
                    // Si ya es una URL/base64
                    fileData = content.file
                } else if (content.file.data) {
                    // Si es un objeto con datos base64
                    fileData = content.file.data
                    fileType = content.file.type || content.fileType
                    fileName = content.file.name || content.fileName
                }
            } else if (content.fileUrl) {
                fileData = content.fileUrl
                fileType = content.fileType
                fileName = content.fileName
            }
        }

        await this.sendMessage(textContent, fileData, fileType, fileName)
    }

    /**
     * Envía un mensaje a través de SignalR
     */
    private async sendMessage(content: string, fileData?: string, fileType?: string, fileName?: string): Promise<void> {
        if (!this.connection) {
            console.error('[SignalR] Conexión no inicializada')
            throw new Error('Conexión no inicializada')
        }

        const state = this.connection.state;
        if (state !== signalR.HubConnectionState.Connected) {
            console.error(`[SignalR] No conectado (estado: ${state}). No se puede enviar el mensaje.`)
            throw new Error(`No conectado al servidor (estado: ${state})`)
        }

        // Verificar que estamos en un canal
        if (!this.lastParams?.channelId) {
            console.error('[SignalR] No hay canal seleccionado')
            throw new Error('No estás conectado a ningún canal')
        }

        try {
            console.log('[SignalR] Enviando mensaje:', {
                contentLength: content.length,
                hasFile: !!fileData,
                fileType,
                fileName,
                channelId: this.lastParams.channelId
            })

            await this.connection.invoke('SendMessage', content, fileData || null, fileType || null, fileName || null)
            console.log('[SignalR] Mensaje enviado exitosamente')
        } catch (err) {
            console.error('[SignalR] Error al enviar mensaje:', err)
            throw err
        }
    }

    /**
     * Método legacy para compatibilidad
     */
    public send(msg: WSMessage): void {
        const content = msg.payload?.text || msg.payload?.content || ''
        const fileUrl = msg.payload?.file || msg.payload?.fileUrl
        const fileType = msg.payload?.fileType
        
        this.sendMessage(content, fileUrl, fileType)
    }

    /**
     * Cierra la conexión SignalR
     */
    public close(): void {
        if (this.connection) {
            this.connection.stop()
                .then(() => console.log('[SignalR] Conexión cerrada'))
                .catch((err) => console.error('[SignalR] Error al cerrar:', err))
        }
        this.connectionStatus$.next(false)
    }

    /**
     * Limpieza al destruir el servicio
     */
    ngOnDestroy(): void {
        this.close()
        this.incoming$.complete()
        this.connectionStatus$.complete()
    }
}