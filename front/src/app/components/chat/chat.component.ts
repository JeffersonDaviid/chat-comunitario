import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core'
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    // Referencia al contenedor para hacer auto-scroll hacia abajo
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef

    communityId = ''
    channelId = ''
    cedula = ''
    outMsg = ''
    messages: WSMessage[] = []
    subMsg?: Subscription
    subStatus?: Subscription
    connected = false
    shouldScrollToBottom = true // Bandera para controlar el scroll

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

        // Suscripción a mensajes en tiempo real
        this.subMsg = this.ws.messages$().subscribe((msg) => {
            const payloadChannel = msg.payload?.channelId
            if (payloadChannel && payloadChannel !== this.channelId) return

            const content = this.extractContent(msg)

            if (content) {
                this.messages.push(msg) // Agregamos al final (estilo chat moderno)
                this.shouldScrollToBottom = true // Activamos scroll
            }
        })

        this.subStatus = this.ws.status$().subscribe((state) => (this.connected = state))

        // Cargar historial si existen IDs
        if (this.communityId && this.channelId) {
            this.loadHistory()
        }
    }

    loadHistory() {
        this.http
            .get<any>(
                `http://localhost:3000/api/auth/communities/${this.communityId}/channels/${this.channelId}/messages`
            )
            .subscribe({
                next: (res) => {
                    const msgs = (res?.messages || []) as Array<any>
                    const adapted: WSMessage[] = msgs.map((m) => ({
                        type: 'chat',
                        payload: {
                            ...m, // Mantenemos todo el objeto original (importante para getUserName)
                            text: m.content,
                            ts: new Date(m.timestamp).getTime(),
                            channelId: this.channelId,
                        },
                    }))
                    
                    // Concatenamos el historial al principio de la lista existente
                    this.messages = adapted.concat(this.messages)
                    this.shouldScrollToBottom = true
                },
                error: (err) => console.error('Error cargando historial', err),
            })
    }

    // Ciclo de vida: Se ejecuta después de que Angular actualiza la vista (HTML)
    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom()
            this.shouldScrollToBottom = false
        }
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight
        } catch (err) {
            // Error silencioso si el elemento aún no existe
        }
    }

    send() {
        if (!this.outMsg.trim()) return
        this.ws.sendChannelMessage(this.channelId, this.outMsg.trim())
        this.outMsg = ''
        this.shouldScrollToBottom = true
    }

    ngOnDestroy(): void {
        if (this.subMsg) this.subMsg.unsubscribe()
        if (this.subStatus) this.subStatus.unsubscribe()
    }

    trackByIndex(i: number, _item: WSMessage) {
        return i
    }

    // --- LÓGICA DE EXTRACCIÓN Y SEGURIDAD ---

    private extractContent(m: WSMessage): string | null {
        const p = m.payload
        if (!p) return null
        let content: string | null = null

        if (typeof p.text === 'string' && p.text) content = p.text
        else if (typeof p.content === 'string' && p.content) content = p.content
        else if (typeof p.message === 'string' && p.message) content = p.message
        else if (p.payload) {
             if (typeof p.payload.text === 'string') content = p.payload.text
        }

        // Filtramos mensajes de sistema no deseados
        if (content && content.startsWith('Conectado a comunidad')) return null
        return content
    }

    renderMessage(m: WSMessage): string {
        return this.extractContent(m) || ''
    }

    // --- MÉTODOS FALTANTES QUE EL HTML NECESITA ---

    /**
     * Obtiene el nombre del usuario buscando en varias propiedades posibles del payload.
     */
    getUserName(m: WSMessage): string {
        const p = m.payload
        if (!p) return 'Sistema'

        // 1. Busca nombre explícito
        if (p.sender?.username) return p.sender.username
        if (p.sender?.name) return p.sender.name
        if (p.user?.username) return p.user.username
        if (p.username) return p.username
        
        // 2. Fallback a identificadores
        if (p.senderId) return `Usuario ${p.senderId.toString().slice(-4)}`
        if (p.cedula) return `Cédula ${p.cedula.slice(-4)}`
        
        return 'Usuario'
    }

    /**
     * Obtiene el avatar. Si no existe, genera uno con las iniciales usando un servicio externo.
     */
    getUserAvatar(m: WSMessage): string {
        const p = m.payload
        // 1. Si ya viene una URL de imagen
        if (p?.sender?.avatar) return p.sender.avatar
        if (p?.user?.avatar) return p.user.avatar
        if (p?.avatar) return p.avatar

        // 2. Generar avatar basado en el nombre
        const name = this.getUserName(m)
        // Usamos UI Avatars (servicio gratuito y rápido)
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`
    }

    /**
     * Determina si el mensaje actual (índice i) fue enviado por la misma persona
     * que el mensaje anterior. Sirve para agrupar visualmente los mensajes.
     */
    isSameUser(i: number): boolean {
        if (i === 0) return false
        const current = this.messages[i]
        const prev = this.messages[i - 1]
        return this.getUserName(current) === this.getUserName(prev)
    }
}