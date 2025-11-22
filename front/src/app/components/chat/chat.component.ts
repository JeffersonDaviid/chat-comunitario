import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core'
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
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef

    communityId = ''
    channelId = ''
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
    allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']

    constructor(
        private route: ActivatedRoute,
        private ws: WebsocketService,
        private http: HttpClient,
        private auth: AuthService
    ) {}

    ngOnInit(): void {
        this.communityId = this.route.snapshot.paramMap.get('communityId') || ''
        this.channelId = this.route.snapshot.paramMap.get('channelId') || ''
        this.cedula = localStorage.getItem('cedula') || ''
        this.loadUserDataFromService();

        console.log('Logueado como:', this.myFullName, 'Cédula:', this.cedula);

        if (this.communityId && this.cedula) {

            this.ws.setIdentity({
                communityId: this.communityId,
                cedula: this.cedula,
                channelId: this.channelId,
            }, false)
        }

        this.subMsg = this.ws.messages$().subscribe((msg) => {
            const payloadChannel = msg.payload?.channelId
            if (payloadChannel && payloadChannel !== this.channelId) return

            const content = this.extractContent(msg)
            const hasFile = this.hasFile(msg)
            
            if (content || hasFile) {
                this.messages.push(msg)
                this.shouldScrollToBottom = true
            }
        })

        this.subStatus = this.ws.status$().subscribe((state) => (this.connected = state))

        if (this.communityId && this.channelId) {
            this.loadHistory()
        }
    }

    private loadUserDataFromService() {
        const u = this.auth.getCurrentUser<any>();

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
                            ...m, 
                            text: m.content,
                            ts: new Date(m.timestamp).getTime(),
                            channelId: this.channelId,
                            // Aseguramos que el historial tenga estructura sender correcta
                            sender: m.sender || { username: 'Historial', cedula: m.senderId } 
                        },
                    }))
                    
                    this.messages = adapted.concat(this.messages)
                    this.shouldScrollToBottom = true
                },
                error: (err) => console.error('Error cargando historial', err),
            })
    }

    ngAfterViewChecked() {
        if (this.shouldScrollToBottom) {
            this.scrollToBottom()
            this.shouldScrollToBottom = false
        }
    }

    scrollToBottom(): void {
        try {
            this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight
        } catch (err) {}
    }
    
    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        const emoji = event.emoji.native;
        this.outMsg += emoji;
    
        // this.showEmojiPicker = false; 
    }
    
    

    send() {
        if (!this.outMsg.trim() && !this.filePreview) return

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
                
                this.ws.sendChannelMessage(this.channelId, messagePayload)
                this.resetForm()
            }
            reader.readAsDataURL(this.filePreview.file)
        } else {
            this.ws.sendChannelMessage(this.channelId, messagePayload)
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
            alert('Tipo de archivo no permitido. Use imágenes (JPG, PNG, GIF, WebP) o documentos (PDF, Word, TXT)')
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

    ngOnDestroy(): void {
        if (this.subMsg) this.subMsg.unsubscribe()
        if (this.subStatus) this.subStatus.unsubscribe()
    }

    trackByIndex(i: number, _item: WSMessage) {
        return i
    }

    // --- LÓGICA VISUAL ---

    private extractContent(m: WSMessage): string | null {
        const p = m.payload
        if (!p) return null
        let content: string | null = null

        const data = p.payload || p;

        if (typeof data === 'string') content = data;
        else if (data.text) content = data.text;
        else if (data.content) content = data.content;
        
        if (content && content.startsWith('Conectado a comunidad')) return null
        
        // Retornar contenido vacío en lugar de null si hay archivo
        // para que se muestre el mensaje con el archivo
        return content || null
    }

    renderMessage(m: WSMessage): string {
        return this.extractContent(m) || ''
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
        if (p && p.payload) p = p.payload

        const msgCedula = p?.cedula || p?.sender?.cedula || p?.senderId;
        return String(msgCedula) === String(this.cedula)
    }
    
    isSameUser(i: number): boolean {
        if (i === 0) return false
        const current = this.messages[i]
        const prev = this.messages[i - 1]
        return this.getUserName(current) === this.getUserName(prev)
    }

    handleImageError(event: any, name: string) {
        if (name === 'Tú') name = this.myFullName;
        event.target.src = this.getInitialsAvatar(name);
    }
}