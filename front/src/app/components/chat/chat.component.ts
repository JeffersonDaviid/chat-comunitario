import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { WebsocketService, WSMessage } from '../../services/websocket.service'
import { Subscription } from 'rxjs'
import { HttpClient, HttpClientModule } from '@angular/common/http'
import { AuthService } from '../../services/auth.service' 

@Component({
    selector: 'chat',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule],
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
        // 2. Obtener Nombre Real (Usando la lógica de tu app.component)
        //this.myFullName = this.getMyNameFromStorage();
        this.loadUserDataFromService();

        console.log('Logueado como:', this.myFullName, 'Cédula:', this.cedula);

        if (this.communityId && this.cedula) {
            // Configurar identidad en el servicio pero sin forzar desconexión agresiva
            this.ws.setIdentity({
                communityId: this.communityId,
                cedula: this.cedula,
                channelId: this.channelId,
            }, false) // false para evitar bucle de reconexión si ya está conectado
        }

        this.subMsg = this.ws.messages$().subscribe((msg) => {
            const payloadChannel = msg.payload?.channelId
            // Filtramos mensajes que no sean de este canal
            if (payloadChannel && payloadChannel !== this.channelId) return

            const content = this.extractContent(msg)
            if (content) {
                this.messages.push(msg)
                this.shouldScrollToBottom = true
            }
        })

        this.subStatus = this.ws.status$().subscribe((state) => (this.connected = state))

        if (this.communityId && this.channelId) {
            this.loadHistory()
        }
    }

    /**
     * Lógica extraída de tu app.component.ts
     * Parsea el objeto 'user' del localStorage y une nombre + apellido
     */
    // private getMyNameFromStorage(): string {
    //     try {
    //         const raw = localStorage.getItem('user')
    //         if (!raw) return 'Usuario ' + this.cedula.slice(-4);
            
    //         const u = JSON.parse(raw)
    //         // Une nombre y apellido, y elimina espacios vacíos
    //         const name = [u?.name, u?.lastName].filter(Boolean).join(' ').trim()
            
    //         return name || u?.email || 'Usuario Anónimo'
    //     } catch (e) {
    //         console.error('Error parseando usuario', e);
    //         return 'Usuario';
    //     }
    // }
    private loadUserDataFromService() {
        // 1. Usamos el método del servicio para obtener el usuario (igual que en Dashboard)
        const u = this.auth.getCurrentUser<any>();

        if (u) {
            // 2. Nombre: Unimos nombre y apellido
            this.myFullName = [u?.name, u?.lastName].filter(Boolean).join(' ').trim() || u?.email || 'Usuario';

            // 3. Foto: Obtenemos el nombre del archivo (ej: "foto.jpg")
            const rawImgName = u?.profileImg || u?.avatar || '';

            // 4. CLAVE: Usamos el helper del Auth para convertirlo en URL completa
            // (http://localhost:3000/src/assets/profiles/...)
            this.myAvatarUrl = this.auth.profileUrl(rawImgName);
            
            console.log('Mi Avatar URL:', this.myAvatarUrl); // Para verificar en consola
        } else {
            this.myFullName = 'Usuario ' + this.cedula.slice(-4);
        }
    }
    // ... (loadHistory, ngAfterViewChecked, scrollToBottom se mantienen igual) ...
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

    send() {
        if (!this.outMsg.trim()) return

        const messagePayload = {
            text: this.outMsg.trim(),
            channelId: this.channelId,
            sender: {
                username: this.myFullName, 
                cedula: this.cedula,
                avatar: this.myAvatarUrl
            },
            cedula: this.cedula
        }

        this.ws.sendChannelMessage(this.channelId, messagePayload);
        this.outMsg = '';
        this.shouldScrollToBottom = true;
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
        return content
    }

    renderMessage(m: WSMessage): string {
        return this.extractContent(m) || ''
    }

    getUserName(m: WSMessage): string {
        let p = m.payload
        if (!p) return 'Sistema'
        
        if (p.payload) p = p.payload

        // 1. Si soy yo (comparamos por cédula, que es única)
        const msgCedula = p.cedula || p.sender?.cedula || p.senderId;
        if (String(msgCedula) === String(this.cedula)) {
            return 'Tú';
        }

        // 2. Si es otro, buscamos su nombre
        if (p.sender) {
            if (p.sender.username) return p.sender.username;
            if (p.sender.name) return p.sender.name; 
            if (p.sender.nombres) return p.sender.nombres;
        }
        
        if (p.username) return p.username;

        // 3. Fallback
        if (msgCedula) return `Usuario ${String(msgCedula).slice(-4)}`;
        
        return 'Desconocido'
    }

    getUserAvatar(m: WSMessage): string {
        let p = m.payload;
        if (!p) return this.getInitialsAvatar('?'); // Fallback rápido

        // Desempaquetar doble payload
        if (p.payload) p = p.payload;

        // 1. Buscar si el mensaje trae una URL de imagen válida
        let avatarUrl = '';

        // Si soy yo, uso mi variable local (más rápido)
        const msgCedula = p.cedula || p.sender?.cedula || p.senderId;
        if (String(msgCedula) === String(this.cedula)) {
            avatarUrl = this.myAvatarUrl;
        } else {
            // Si es otro, busco en el objeto sender
            avatarUrl = p.sender?.avatar || p.sender?.image || p.user?.avatar || '';
        }

        // 2. Si encontramos URL, la devolvemos
        if (avatarUrl && avatarUrl.trim() !== '') {
            return avatarUrl;
        }

        // 3. Si NO hay URL, generamos las iniciales
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
        
        // Comparamos string con string para evitar fallos
        return String(msgCedula) === String(this.cedula)
    }
    
    isSameUser(i: number): boolean {
        if (i === 0) return false
        const current = this.messages[i]
        const prev = this.messages[i - 1]
        return this.getUserName(current) === this.getUserName(prev)
    }
    // Agrega esto en tu clase ChatComponent

    handleImageError(event: any, name: string) {
        if (name === 'Tú') name = this.myFullName;
        event.target.src = this.getInitialsAvatar(name);
    }
}