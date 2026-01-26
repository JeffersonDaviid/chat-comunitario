import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { CommunityService } from '../../services/community.service'

export interface User {
  cedula: string
  name: string
  lastName: string
  email: string
  profileImg?: string
}

@Component({
  selector: 'app-invite-users-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-96 flex flex-col">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Invitar Usuarios</h2>
        
        <!-- Search Input -->
        <input
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Buscar usuario..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
        />

        <!-- Users List - Scrollable -->
        <div class="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg">
          <div *ngIf="filteredUsers.length === 0" class="p-4 text-center text-gray-500">
            <p *ngIf="users.length === 0">Cargando usuarios...</p>
            <p *ngIf="users.length > 0">No se encontraron usuarios</p>
          </div>

          <div *ngFor="let user of filteredUsers" class="p-3 border-b border-gray-100 hover:bg-gray-50">
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="selectedUsers[user.cedula]"
                class="w-4 h-4 text-blue-600 rounded"
              />
              <div class="ml-3 flex-1">
                <p class="font-medium text-gray-900">{{ user.name }} {{ user.lastName }}</p>
                <p class="text-xs text-gray-500">{{ user.email }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Selected Count -->
        <div class="mb-4 p-2 bg-blue-50 rounded-lg text-sm text-blue-700">
          {{ getSelectedCount() }} usuario(s) seleccionado(s)
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMsg" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {{ errorMsg }}
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 justify-end">
          <button
            (click)="onCancel()"
            class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            (click)="onInvite()"
            [disabled]="isInviting || getSelectedCount() === 0"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isInviting ? 'Invitando...' : 'Invitar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .overflow-y-auto {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f1f5f9;
      }
      .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
      }
      .overflow-y-auto::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 10px;
      }
      .overflow-y-auto::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
    }
  `]
})
export class InviteUsersModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false
  @Input() excludeCedula = ''
  @Output() onClose = new EventEmitter<void>()
  @Output() onUsersInvited = new EventEmitter<string[]>()

  users: User[] = []
  selectedUsers: { [cedula: string]: boolean } = {}
  searchTerm = ''
  isInviting = false
  errorMsg = ''

  get filteredUsers(): User[] {
    return this.users.filter(u =>
      `${u.name} ${u.lastName} ${u.email}`
        .toLowerCase()
        .includes(this.searchTerm.toLowerCase())
    )
  }

  getSelectedCount(): number {
    return Object.keys(this.selectedUsers).filter(k => this.selectedUsers[k]).length
  }

  readonly Object = Object

  constructor(private communityService: CommunityService) {}

  ngOnInit() {
    console.log('[InviteModal] ngOnInit, isOpen:', this.isOpen, 'excludeCedula:', this.excludeCedula)
    if (this.isOpen) {
      this.loadAvailableUsers()
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('[InviteModal] ngOnChanges:', changes)
    if (changes['isOpen']?.currentValue === true) {
      console.log('[InviteModal] Modal opened, loading users')
      this.loadAvailableUsers()
    }
  }

  loadAvailableUsers() {
    console.log('[InviteModal] loadAvailableUsers called with excludeCedula:', this.excludeCedula)
    this.communityService.getAvailableUsers(this.excludeCedula).subscribe({
      next: (response) => {
        console.log('[InviteModal] Available users response:', response)
        if (response?.success) {
          this.users = response.users || []
          console.log('[InviteModal] Users loaded:', this.users.length, this.users)
          this.selectedUsers = {}
          this.errorMsg = ''
        } else {
          this.errorMsg = response?.message || 'Error cargando usuarios'
          console.error('[InviteModal] Error in response:', this.errorMsg)
        }
      },
      error: (error) => {
        this.errorMsg = 'Error al cargar usuarios disponibles'
        console.error('[InviteModal] Error loading available users:', error)
      }
    })
  }

  onInvite() {
    const selectedCedulas = Object.keys(this.selectedUsers).filter(k => this.selectedUsers[k])
    
    if (selectedCedulas.length === 0) {
      this.errorMsg = 'Selecciona al menos un usuario'
      return
    }

    this.isInviting = true
    this.errorMsg = ''

    // Emitir los usuarios seleccionados para que el padre maneje la invitación
    this.onUsersInvited.emit(selectedCedulas)
    this.isInviting = false
  }

  onCancel() {
    this.selectedUsers = {}
    this.searchTerm = ''
    this.errorMsg = ''
    this.onClose.emit()
  }
}
