import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked, Input, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { WebsocketService, WSMessage } from '../../services/websocket.service'
import { Subscription } from 'rxjs'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { AuthService } from '../../services/auth.service'
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


interface FilePreview {
    file: File
    preview: string | ArrayBuffer | null
    type: 'image' | 'document'
} 

@Component({
    selector: 'chat',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule, PickerComponent],
    templateUrl: './chat.component.html',
    styleUrl: './chat.component.css',

})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
    @ViewChild('scrollContainer') private readonly scrollContainer!: ElementRef
    
    // Inputs para uso embebido en dashboard
    @Input() communityId = ''
    @Input() channelId = ''
    @Input() communityName = ''
    @Input() channelName = ''
    cedula = ''
    outMsg = ''
    myFullName = '' 
    myAvatarUrl = '';

    messages: WSMessage[] = []
    subMsg?: Subscription
    subStatus?: Subscription
    connected = false
    shouldScrollToBottom = true
    showEmojiPicker = false;
    
    filePreview: FilePreview | null = null
    maxFileSize = 50 * 1024 * 1024; // 50MB
    allowedImageTypes = ['image/jpeg', 'image/png']
    allowedDocTypes = ['application/pdf']

    constructor(
        private readonly route: ActivatedRoute,
        private readonly ws: WebsocketService,
        private readonly http: HttpClient,
        private readonly auth: AuthService
    ) {}

    ngOnInit(): void {
        // Si no vienen por @Input, intentar obtener de la ruta (compatibilidad con ruta standalone)
        if (!this.communityId || !this.channelId) {
            this.communityId = this.route.snapshot.paramMap.get('communityId') || ''
            this.channelId = this.route.snapshot.paramMap.get('channelId') || ''
        }
        
		this.cedula = sessionStorage.getItem('cedula') || ''
        console.log(`[Chat] Componente iniciado - Community: ${this.communityId}, Channel: ${this.channelId}`)

        // Cargar datos del usuario
        this.loadUserDataFromService()

        // Inicializar el chat
        this.initializeChat()
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Cuando cambian los inputs (al cambiar de canal en el dashboard)
        if ((changes['communityId'] || changes['channelId']) && !changes['communityId']?.firstChange) {
            console.log('[Chat] Inputs changed, reinitializing chat')
            this.cleanup()
            this.messages = []
            this.initializeChat()
        }
    }

    private initializeChat(): void {
        // PRIMERO: Obtener nombres de comunidad y canal desde la API (si no vienen por @Input)
        if (this.communityId && this.channelId && (!this.communityName || !this.channelName)) {
            this.http.get<any>(`http://localhost:5000/api/community/${this.communityId}`).subscribe({
                next: (res) => {
                    const community = res.community
                    this.communityName = community.title || ''
                    const channel = community.channels?.find((ch: any) => ch.id === this.channelId)
                    this.channelName = channel?.name || ''
                    console.log(`[Chat] Nombres obtenidos - Comunidad: ${this.communityName}, Canal: ${this.channelName}`)
                    this.connectAndLoadMessages()
                },
                error: (err) => {
                    console.error('[Chat] Error obteniendo comunidad:', err)
                    this.connectAndLoadMessages()
                }
            })
        } else {
            this.connectAndLoadMessages()
        }
    }

    private connectAndLoadMessages(): void {
        // PRIMERO: Suscribirse a mensajes en vivo
        this.subMsg = this.ws.messages$().subscribe((msg) => {
            console.log('[Chat] Mensaje recibido del WS:', msg.type, msg.payload?.message || msg.payload?.text || msg.payload?.content)
            
            // Si es un mensaje de bienvenida, extraer nombres de comunidad y canal
            if (msg.type === 'welcome' && msg.payload?.communityName && msg.payload?.channelName) {
                this.communityName = msg.payload.communityName
                this.channelName = msg.payload.channelName
                console.log(`[Chat] Nombres recibidos del WS - Comunidad: ${this.communityName}, Canal: ${this.channelName}`)
                // Después de recibir bienvenida, cargar historial
                if (this.messages.length === 0) {
                    this.loadHistory()
                }
                return // No agregar el mensaje de bienvenida a la lista
            }
            
            const payloadChannel = msg.payload?.channelId
            if (payloadChannel && payloadChannel !== this.channelId) {
                console.log(`[Chat] Mensaje descartado: no pertenece a este canal (${payloadChannel} !== ${this.channelId})`)
                return
            }

            const content = this.extractContent(msg)
            const hasFile = this.hasFile(msg)
            
            console.log(`[Chat] Content: "${content}", HasFile: ${hasFile}`)
            
            if (content || hasFile) {
                console.log(`[Chat] Mensajes antes de push: ${this.messages.length}`)
                this.messages.push(msg)
                console.log(`[Chat] Mensajes después de push: ${this.messages.length}`)
                this.shouldScrollToBottom = true
                console.log(`[Chat] ✅ Mensaje añadido. Total: ${this.messages.length}`)
            } else {
                console.log(`[Chat] ⏭️ Mensaje ignorado (vacío o de sistema)`)
            }
        })

        this.subStatus = this.ws.status$().subscribe((state) => {
            this.connected = state
            console.log(`[Chat] WebSocket conectado: ${state}`)
        })

        // SEGUNDO: Establecer identidad y conectar
        if (this.communityId && this.cedula && this.channelId) {
            console.log(`[Chat] Llamando setIdentity - comunityId: ${this.communityId}, channelId: ${this.channelId}`)
            this.ws.setIdentity({
                communityId: this.communityId,
                cedula: this.cedula,
                channelId: this.channelId,
            }, true) // reconnect = true para establecer la conexión inmediatamente
        }
    }

    private loadUserDataFromService() {
        const u = this.auth.getCurrentUser();

        if (u) {
            this.myFullName = [u?.name, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'Usuario';

            const rawImgName = u?.profileImg || u?.avatar || '';

            this.myAvatarUrl = this.auth.profileUrl(rawImgName);
            
            console.log('Mi Avatar URL:', this.myAvatarUrl);
        } else {
            this.myFullName = 'Usuario ' + this.cedula.slice(-4);
        }
    }

    loadHistory() {
        console.log(`[Chat] Iniciando carga de historial para canal: ${this.channelId}...`)
        this.http
            .get<any>(
                `http://localhost:5000/api/message/channel/${this.communityId}/${this.channelId}?limit=50`
            )
            .subscribe({
                next: (res) => {
                    const msgs = (res?.messages || []) as Array<any>
                    console.log(`[Chat] Historial recibido: ${msgs.length} mensajes`)
                
                    const adapted: WSMessage[] = msgs.map((m) => {
                        return {
                            type: 'chat',
                            messageType: 'chat',
                            payload: {
                                id: m.id,
                                cedula: m.cedula || m.senderId || m.sender?.cedula,
                                senderId: m.senderId || m.sender?.cedula || m.cedula,
                                sender: m.sender || { 
                                    cedula: m.cedula || m.senderId,
                                    username: 'Usuario Eliminado',
                                    avatar: ''
                                },
                                text: m.text || m.content || '',
                                content: m.content || m.text || '',
                                file: m.file || null,
                                fileType: m.fileType || null,
                                channelId: m.channelId || this.channelId,
                                ts: m.ts || new Date(m.timestamp).getTime(),
                                timestamp: m.timestamp,
                                isHistory: true
                            },
                        };
                    });
                    
                    // Remover mensajes históricos previos y agregar los nuevos
                    this.messages = adapted;
                    this.shouldScrollToBottom = true
                    
                    console.log(`[Chat] ✅ Historial cargado. Total de mensajes: ${this.messages.length}`)
                },
                error: (err) => {
                    console.error('[Chat] Error cargando historial:', err)
                    // Continuar sin historial si hay error
                }
            })
    }

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom()
            this.shouldScrollToBottom = false
        }
    }

    scrollToBottom(): void {
        if (this.scrollContainer?.nativeElement) {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight
        }
    }
    
    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        const emoji = event.emoji.native;
        this.outMsg += emoji;
    }
    
    

    send() {
        if (!this.outMsg.trim() && !this.filePreview) {
            console.warn('[Chat] Intento de envío con mensaje vacío')
            return
        }

        if (!this.connected) {
            console.error('[Chat] WebSocket no conectado. Estado:', this.connected)
            alert('Esperando conexión WebSocket. Por favor espera un momento...')
            return
        }

        const messagePayload: any = {
            text: this.outMsg.trim(),
            channelId: this.channelId,
            sender: {
                username: this.myFullName, 
                cedula: this.cedula,
                avatar: this.myAvatarUrl
            },
            cedula: this.cedula
        }

        if (this.filePreview) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const base64Data = e.target?.result as string
                messagePayload.file = {
                    name: this.filePreview!.file.name,
                    type: this.filePreview!.file.type,
                    size: this.filePreview!.file.size,
                    data: base64Data
                }
                
                console.log('[Chat] Enviando mensaje con archivo:', {
                    fileName: this.filePreview!.file.name,
                    fileSize: this.filePreview!.file.size,
                    hasText: !!this.outMsg.trim()
                })
                
                this.ws.sendChannelMessage(this.channelId, messagePayload)
                    .catch(err => {
                        console.error('[Chat] Error al enviar mensaje con archivo:', err)
                        alert('Error al enviar mensaje: ' + err.message)
                    })
                this.resetForm()
            }
            reader.onerror = (err) => {
                console.error('[Chat] Error al leer archivo:', err)
                alert('Error al procesar el archivo. Intenta de nuevo.')
            }
            reader.readAsDataURL(this.filePreview.file)
        } else {
            console.log('[Chat] Enviando mensaje de texto:', {
                textLength: this.outMsg.length,
                cedula: this.cedula,
                channelId: this.channelId
            })
            
            this.ws.sendChannelMessage(this.channelId, messagePayload)
                .catch(err => {
                    console.error('[Chat] Error al enviar mensaje:', err)
                    alert('Error al enviar mensaje: ' + err.message)
                })
            this.resetForm()
            this.shouldScrollToBottom = true
        }
    }

    private resetForm() {
        this.outMsg = ''
        this.filePreview = null
    }

    onFileSelected(event: any) {
        const files = event.target.files
        if (!files || files.length === 0) return

        const file = files[0]

        if (file.size > this.maxFileSize) {
            alert(`El archivo es demasiado grande. Máximo: ${this.maxFileSize / 1024 / 1024}MB`)
            return
        }

        const isImage = this.allowedImageTypes.includes(file.type)
        const isDocument = this.allowedDocTypes.includes(file.type)

        if (!isImage && !isDocument) {
            alert('Tipo de archivo no permitido. Use imágenes (JPG, PNG) o documentos (PDF). Máximo: 50MB')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            this.filePreview = {
                file,
                preview: e.target?.result || null,
                type: isImage ? 'image' : 'document'
            }
        }
        reader.readAsDataURL(file)
    }

    clearFilePreview() {
        this.filePreview = null
    }

    downloadFile(m: WSMessage) {
        let p = m.payload
        if (!p) return
        if (p.payload) p = p.payload

        let file = p.file
        
        // Si el archivo está anidado más profundo
        if (!file && p.payload?.file) {
            file = p.payload.file
        }
        
        if (!file) return

        const link = document.createElement('a')
        link.href = file.data
        link.download = file.name
        link.click()
    }

    getFileExtension(fileName: string): string {
        return fileName.split('.').pop()?.toUpperCase() || 'FILE'
    }

    hasFile(m: WSMessage): boolean {
        let p = m.payload
        if (!p) return false
        if (p.payload) p = p.payload
        
        if (p.file) return true
        
        // Buscar en estructura anidada
        if (p.payload?.file) return true
        
        return false
    }

    isImage(m: WSMessage): boolean {
        let p = m.payload
        if (!p) return false
        if (p.payload) p = p.payload
        
        let file = p.file
        if (!file && p.payload?.file) {
            file = p.payload.file
        }
        
        return file && this.allowedImageTypes.includes(file.type)
    }

    private cleanup(): void {
        // Limpiar suscripciones sin cerrar la conexión WebSocket
        if (this.subMsg) {
            this.subMsg.unsubscribe()
            this.subMsg = undefined
        }
        if (this.subStatus) {
            this.subStatus.unsubscribe()
            this.subStatus = undefined
        }
    }

    ngOnDestroy(): void {
        // Nota: NO cerramos la conexión WebSocket aquí, solo nos desuscribimos de los observables
        // Esto permite que la conexión persista cuando navegamos entre canales
        this.cleanup()
    }

    trackByIndex(i: number, _item: WSMessage) {
        return i
    }

    // --- LÓGICA VISUAL ---

    // En chat.component.ts

    private extractContent(m: WSMessage): string | null {
        const p = m.payload
        if (!p) return null
        let content: string | null = null

        const data = p.payload || p;

        if (typeof data === 'string') content = data;
        else if (data.text) content = data.text;
        else if (data.content) content = data.content;
        
        if (!content || content === 'null' || content === 'undefined') return null;
    
        if (content.trim().length === 0) return null;

        if (content.startsWith('Conectado a comunidad')) return null;
        
        return content;
    }

    getUserName(m: WSMessage): string {
        let p = m.payload
        if (!p) return 'Sistema'
        
        if (p.payload) p = p.payload

        const msgCedula = p.cedula || p.sender?.cedula || p.senderId;
        if (String(msgCedula) === String(this.cedula)) {
            return 'Tú';
        }

        if (p.sender) {
            if (p.sender.username) return p.sender.username;
            if (p.sender.name) return p.sender.name; 
            if (p.sender.nombres) return p.sender.nombres;
        }
        
        if (p.username) return p.username;

        if (msgCedula) return `Usuario ${String(msgCedula).slice(-4)}`;
        
        return 'Desconocido'
    }

    getUserAvatar(m: WSMessage): string {
        let p = m.payload;
        if (!p) return this.getInitialsAvatar('?'); // Fallback rápido

        // Desempaquetar doble payload
        if (p.payload) p = p.payload;

        let avatarUrl = '';

        const msgCedula = p.cedula || p.sender?.cedula || p.senderId;
        if (String(msgCedula) === String(this.cedula)) {
            avatarUrl = this.myAvatarUrl;
        } else {
            avatarUrl = p.sender?.avatar || p.sender?.image || p.user?.avatar || '';
        }

        if (avatarUrl && avatarUrl.trim() !== '') {
            return avatarUrl;
        }

        let name = this.getUserName(m);
        if (name === 'Tú') name = this.myFullName;
        
        return this.getInitialsAvatar(name);
    }

    private getInitialsAvatar(name: string): string {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
    }

    isMine(m: WSMessage): boolean {
        let p = m.payload
        if (p?.payload) p = p.payload

        const msgCedula = p?.cedula || p?.sender?.cedula || p?.senderId;
        return String(msgCedula) === String(this.cedula)
    }
    
    isSameUser(i: number): boolean {
        if (i === 0) return false
        const current = this.messages[i]
        const prev = this.messages[i - 1]
        return this.getUserName(current) === this.getUserName(prev)
    }

    renderMessage(m: WSMessage): string | null {
        return this.extractContent(m);
    }

    /**
     * Formatea un timestamp para mostrar de manera amigable
     * 12:30 (hoy), Ayer 14:20, 5 ene 10:15
     */
    formatTime(timestamp: any): string {
        if (!timestamp) return '';
        
        let date: Date;
        if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else {
            return '';
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        if (messageDate.getTime() === today.getTime()) {
            return timeStr;
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return `Ayer ${timeStr}`;
        } else {
            const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            return `${dateStr} ${timeStr}`;
        }
    }
    handleImageError(event: any, name: string) {
        if (name === 'Tú') name = this.myFullName;
        event.target.src = this.getInitialsAvatar(name);
    }
}