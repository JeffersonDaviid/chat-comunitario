import { Component, OnDestroy, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { WebsocketService, WSMessage } from '../../services/websocket.service'
import { Subscription } from 'rxjs'
import { HttpClient, HttpClientModule } from '@angular/common/http'

@Component({
	selector: 'chat',
	standalone: true,
	imports: [CommonModule, FormsModule, HttpClientModule],
	templateUrl: './chat.component.html',
	styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
	communityId = ''
	channelId = ''
	cedula = ''
	outMsg = ''
	messages: WSMessage[] = []
	subMsg?: Subscription
	subStatus?: Subscription
	connected = false

	constructor(
		private route: ActivatedRoute,
		private ws: WebsocketService,
		private http: HttpClient
	) {}

	ngOnInit(): void {
		this.communityId = this.route.snapshot.paramMap.get('communityId') || ''
		this.channelId = this.route.snapshot.paramMap.get('channelId') || ''
		this.cedula = localStorage.getItem('cedula') || ''

		if (this.communityId && this.cedula) {
			this.ws.setIdentity({
				communityId: this.communityId,
				cedula: this.cedula,
				channelId: this.channelId,
			})
		}

		this.subMsg = this.ws.messages$().subscribe((msg) => {
			// Filtrar por channelId si viene en payload
			const payloadChannel = msg.payload?.channelId
			if (payloadChannel && payloadChannel !== this.channelId) return
			if (msg.type === 'chat' || msg.type === 'message') {
				this.messages.unshift(msg)
			}
		})

		this.subStatus = this.ws.status$().subscribe((state) => (this.connected = state))

		// Cargar historial del canal
		if (this.communityId && this.channelId) {
			this.http
				.get<any>(
					`http://localhost:3000/api/auth/communities/${this.communityId}/channels/${this.channelId}/messages`
				)
				.subscribe({
					next: (res) => {
						const msgs = (res?.messages || []) as Array<{
							content: string
							timestamp: string
						}>
						// Adaptar a WSMessage y agregar al inicio de la lista (cronológico)
						const adapted: WSMessage[] = msgs.map((m) => ({
							type: 'chat',
							payload: {
								text: m.content,
								ts: new Date(m.timestamp).getTime(),
								channelId: this.channelId,
							},
						}))
						// Mostrar más antiguos primero
						this.messages = adapted.reverse().concat(this.messages)
					},
					error: () => {},
				})
		}
	}

	send() {
		if (!this.outMsg.trim()) return
		this.ws.sendChannelMessage(this.channelId, this.outMsg.trim())
		this.outMsg = ''
	}

	ngOnDestroy(): void {
		if (this.subMsg) this.subMsg.unsubscribe()
		if (this.subStatus) this.subStatus.unsubscribe()
	}

	trackByIndex(i: number, _item: WSMessage) {
		return i
	}

	renderMessage(m: WSMessage): string {
		if (!m.payload) return ''
		if (typeof m.payload.text === 'string') return m.payload.text
		if (m.payload.content) return String(m.payload.content)
		return JSON.stringify(m.payload)
	}
}
