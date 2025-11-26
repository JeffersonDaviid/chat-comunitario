import { Injectable, OnDestroy } from '@angular/core'
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'
import { Observable, Subject, timer, Subscription } from 'rxjs'
import { retryWhen, delayWhen, tap } from 'rxjs/operators'

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
    // Base URL for the WebSocket connection
    private WS_BASE = 'ws://localhost:3000/ws'
    private socket$?: WebSocketSubject<WSMessage>
    private connectionStatus$ = new Subject<boolean>() // To notify connection status
    private incoming$ = new Subject<WSMessage>() // To emit incoming messages
    private reconnectInterval = 3000
    private manualClose = false // Flag to differentiate manual close from disconnection
    private sub?: Subscription // Active subscription to the socket
    private lastParams?: WSConnectParams // Last parameters used for reconnection

    // Exposes incoming messages as an Observable
    public messages$(): Observable<WSMessage> {
        return this.incoming$.asObservable()
    }

    // Exposes the connection status as an Observable
    public status$(): Observable<boolean> {
        return this.connectionStatus$.asObservable()
    }

    constructor() {
        // Auto-connect logic upon service initialization (if saved data exists)
        const cid = localStorage.getItem('communityId') || undefined
        const ced = localStorage.getItem('cedula') || undefined
        if (cid && ced) {
            this.connect({ communityId: cid, cedula: ced })
        }
    }

    /**
     * Establishes a new WebSocket connection.
     * CRITICAL FIX: If a connection already exists, it is closed and unsubscribed
     * to prevent message duplication errors.
     */
    public connect(params: WSConnectParams) {
        // FIX 1: Close and unsubscribe previous connections before creating a new one.
        if (this.socket$ || this.sub) {
            console.log('[WS] Cerrando conexión y suscripción existentes antes de una nueva llamada a connect().')
            this.close() // Unsubscribes and completes the socket
        }

        this.manualClose = false
        this.lastParams = params
        const url = this.buildUrl(params)
        
        // 1. Create the new WebSocketSubject connection
        this.socket$ = webSocket<WSMessage>({
            url,
            // Open Observer
            openObserver: {
                next: () => {
                    console.log('[WS] Conectado')
                    this.connectionStatus$.next(true)
                },
            },
            // Close Observer
            closeObserver: {
                next: () => {
                    console.log('[WS] Desconectado')
                    this.connectionStatus$.next(false)
                    // Attempt to reconnect only if it wasn't a manual close
                    if (!this.manualClose) this.tryReconnect()
                },
            },
        })

        // 2. Subscribe to the new connection
        this.sub = this.socket$
            .pipe(
                // Reconnection logic with simple exponential delay
                retryWhen((errors) =>
                    errors.pipe(
                        tap((err) => {
                            console.warn('[WS] Error de socket. Reintentando conexión...', err)
                            this.connectionStatus$.next(false)
                        }),
                        delayWhen(() => timer(this.reconnectInterval))
                    )
                )
            )
            .subscribe(
                (msg: any) => {
                    // Get the raw payload (can be an object or a plain string)
                    let rawPayload = msg?.payload ?? msg?.data ?? msg
                    
                    // FIX 2 (Normalization): If the raw payload is a string (pure chat message), 
                    // wrap it into a { text: string } object for the ChatComponent to read.
                    if (typeof rawPayload === 'string') {
                        rawPayload = { text: rawPayload }
                        msg.type = msg.type || 'chat' // Assume it's a chat message if it's just text
                    }

                    // Normalize the structure of the received message
                    const normalized: WSMessage = {
                        type: msg?.type,
                        messageType: msg?.messageType,
                        payload: rawPayload,
                    }
                    
                    // Map ISO timestamp to payload.ts number if it exists
                    const iso = msg?.timestamp || msg?.payload?.timestamp || msg?.data?.timestamp
                    if (iso && typeof normalized.payload === 'object' && normalized.payload) {
                        ;(normalized.payload as any).ts = Date.parse(iso)
                    }
                    
                    // Emit the normalized message to the service subscribers
                    this.incoming$.next(normalized)
                },
                (err) => {
                    console.error('[WS] Error de suscripción', err)
                }
            )
    }

    /**
     * Attempts to reconnect after a timeout.
     */
    private tryReconnect() {
        setTimeout(() => {
            if (!this.manualClose && this.lastParams) {
                console.log('[WS] Reintentando conexión...')
                this.connect(this.lastParams)
            }
        }, this.reconnectInterval)
    }

    /**
     * Builds the WebSocket URL with connection parameters.
     */
    private buildUrl(params: WSConnectParams): string {
        const qs = new URLSearchParams({
            communityId: params.communityId,
            cedula: params.cedula,
        })
        if (params.channelId) qs.set('channelId', params.channelId)
        return `${this.WS_BASE}?${qs.toString()}`
    }

    /**
     * Sets the user identity and reconnects if necessary.
     */
    public setIdentity(params: WSConnectParams, reconnect = true) {
        this.lastParams = params
        localStorage.setItem('communityId', params.communityId)
        localStorage.setItem('cedula', params.cedula)
        if (reconnect) {
            this.close()
            this.connect(params)
        }
    }

    /**
     * Sends a message through the WebSocket.
     */
    public send(msg: WSMessage) {
        try {
            if (this.socket$) {
                this.socket$.next(msg)
            } else {
                console.warn('[WS] Socket no está listo. No se pudo enviar el mensaje.')
            }
        } catch (e) {
            console.error('[WS] Error al enviar mensaje', e)
        }
    }

 
    public sendText(text: string) {
        const payload: WSMessage = { type: 'chat', payload: { text, ts: Date.now() } }
        this.send(payload)
    }

   
    public sendChannelMessage(channelId: string, content: string | any) {
        let payloadData: any = {
            ts: Date.now(),
            channelId
        };

        if (typeof content === 'string') {
            // Si es solo texto, lo asignamos a la propiedad text
            payloadData.text = content;
        } else {
            // Si es un objeto (con sender, cedula, file, etc), lo mezclamos
            payloadData = { ...payloadData, ...content };
        }

        const msg: WSMessage = {
            type: 'chat',
            payload: payloadData,
        }
        
        this.send(msg)
    }

    
    public close() {
        this.manualClose = true // Prevents automatic reconnection
        if (this.socket$) {
            this.socket$.complete() // Closes the WS connection
            this.socket$ = undefined // Clears the reference
        }
        this.connectionStatus$.next(false)
        if (this.sub) {
            this.sub.unsubscribe() // Unsubscribes the message handler
            this.sub = undefined // Clears the reference
        }
    }

    
    ngOnDestroy(): void {
        this.close()
        this.incoming$.complete()
        this.connectionStatus$.complete()
    }
}