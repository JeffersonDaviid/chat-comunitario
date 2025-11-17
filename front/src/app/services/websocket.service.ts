// src/app/services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core'
import { webSocket, WebSocketSubject } from 'rxjs/webSocket'
import { Observable, Subject, timer, Subscription } from 'rxjs'
import { retryWhen, delayWhen, tap } from 'rxjs/operators'

export interface WSMessage {
	type?: string
	messageType?: string
	payload?: any
}

export interface WSConnectParams {
	communityId: string
	cedula: string
	channelId?: string
}

@Injectable({
	providedIn: 'root',
})
export class WebsocketService implements OnDestroy {
	private WS_BASE = 'ws://localhost:3000/ws'
	private socket$?: WebSocketSubject<WSMessage>
	private connectionStatus$ = new Subject<boolean>()
	private incoming$ = new Subject<WSMessage>()
	private reconnectInterval = 3000
	private manualClose = false
	private sub?: Subscription
	private lastParams?: WSConnectParams

	public messages$(): Observable<WSMessage> {
		return this.incoming$.asObservable()
	}

	public status$(): Observable<boolean> {
		return this.connectionStatus$.asObservable()
	}

	constructor() {
		// Auto-conectar si existen parámetros guardados
		const cid = localStorage.getItem('communityId') || undefined
		const ced = localStorage.getItem('cedula') || undefined
		if (cid && ced) {
			this.connect({ communityId: cid, cedula: ced })
		}
	}

	public connect(params: WSConnectParams) {
		this.manualClose = false
		this.lastParams = params
		const url = this.buildUrl(params)
		this.socket$ = webSocket<WSMessage>({
			url,
			openObserver: {
				next: () => {
					console.log('[WS] Connected')
					this.connectionStatus$.next(true)
				},
			},
			closeObserver: {
				next: () => {
					console.log('[WS] Disconnected')
					this.connectionStatus$.next(false)
					if (!this.manualClose) this.tryReconnect()
				},
			},
		})

		this.sub = this.socket$
			.pipe(
				retryWhen((errors) =>
					errors.pipe(
						tap((err) => {
							console.warn('[WS] socket error', err)
							this.connectionStatus$.next(false)
						}),
						delayWhen(() => timer(this.reconnectInterval))
					)
				)
			)
			.subscribe(
				(msg: any) => {
					// Normalizar estructura: el backend envía { data, timestamp, ... }
					const normalized: WSMessage = {
						type: msg?.type,
						messageType: msg?.messageType,
						payload: msg?.payload ?? msg?.data ?? msg,
					}
					// Mapear timestamp ISO a payload.ts num si existe
					const iso = msg?.timestamp || msg?.payload?.timestamp || msg?.data?.timestamp
					if (iso && typeof normalized.payload === 'object' && normalized.payload) {
						;(normalized.payload as any).ts = Date.parse(iso)
					}
					this.incoming$.next(normalized)
				},
				(err) => {
					console.error('[WS] subscription error', err)
				}
			)
	}

	private tryReconnect() {
		setTimeout(() => {
			if (!this.manualClose && this.lastParams) {
				this.connect(this.lastParams)
			}
		}, this.reconnectInterval)
	}

	private buildUrl(params: WSConnectParams): string {
		const qs = new URLSearchParams({
			communityId: params.communityId,
			cedula: params.cedula,
		})
		if (params.channelId) qs.set('channelId', params.channelId)
		return `${this.WS_BASE}?${qs.toString()}`
	}

	public setIdentity(params: WSConnectParams, reconnect = true) {
		this.lastParams = params
		localStorage.setItem('communityId', params.communityId)
		localStorage.setItem('cedula', params.cedula)
		if (reconnect) {
			this.close()
			this.connect(params)
		}
	}

	public send(msg: WSMessage) {
		try {
			if (this.socket$) {
				this.socket$.next(msg)
			} else {
				console.warn('[WS] socket not ready')
			}
		} catch (e) {
			console.error('[WS] send error', e)
		}
	}

	public sendText(text: string) {
		const payload: WSMessage = { type: 'chat', payload: { text, ts: Date.now() } }
		this.send(payload)
	}

	public sendChannelMessage(channelId: string, text: string) {
		const payload: WSMessage = {
			type: 'chat',
			payload: { text, ts: Date.now(), channelId },
		}
		this.send(payload)
	}

	public close() {
		this.manualClose = true
		if (this.socket$) {
			this.socket$.complete()
		}
		this.connectionStatus$.next(false)
		if (this.sub) this.sub.unsubscribe()
	}

	ngOnDestroy(): void {
		this.close()
		this.incoming$.complete()
		this.connectionStatus$.complete()
	}
}
