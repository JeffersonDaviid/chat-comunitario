import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import {
	ReactiveFormsModule,
	FormBuilder,
	Validators,
	AbstractControl,
	ValidationErrors,
} from '@angular/forms'
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http'
import { AuthService } from '../../services/auth.service'

@Component({
	selector: 'register',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
	templateUrl: './register.component.html',
	styleUrl: './register.component.css',
})
export class RegisterComponent {
	fb = inject(FormBuilder)
	auth = inject(AuthService)

	loading = false
	successMsg = ''
	errorMsg = ''
	selectedFile: File | null = null
	imagePreview: string | null = null // Para la previsualización de la imagen
	imageError = ''

	form = this.fb.group(
		{
			cedula: ['', [Validators.required]],
			name: ['', [Validators.required]],
			lastName: ['', [Validators.required]],
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(6)]],
			confirmPassword: ['', [Validators.required]],
			address: ['', [Validators.required]],
			profile: [null as File | null],
		},
		{ validators: [this.passwordsMatchValidator] }
	)

	private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
		const pwd = group.get('password')?.value
		const conf = group.get('confirmPassword')?.value
		return pwd && conf && pwd !== conf ? { passwordsMismatch: true } : null
	}

	get f() {
		return this.form.controls
	}

	onFileChange(input: HTMLInputElement) {
		if (input.files && input.files.length) {
			const file = input.files[0]
			this.imageError = ''

			// Validaciones básicas: tipo de archivo e tamaño máximo 2MB
			const isImage = file.type.startsWith('image/')
			const isUnder2MB = file.size <= 2 * 1024 * 1024
			if (!isImage) {
				this.resetImageSelection()
				this.imageError = 'El archivo debe ser una imagen.'
				return
			}
			if (!isUnder2MB) {
				this.resetImageSelection()
				this.imageError = 'La imagen supera los 2MB.'
				return
			}

			this.selectedFile = file

			// Actualiza el control del formulario con el archivo
			this.form.patchValue({
				profile: file,
			})
			this.form.get('profile')?.updateValueAndValidity()

			// Lector de archivos para la previsualización
			const reader = new FileReader()
			reader.onload = () => {
				this.imagePreview = reader.result as string
			}
			reader.readAsDataURL(file)
		} else {
			this.resetImageSelection()
		}
	}

	private resetImageSelection() {
		this.selectedFile = null
		this.imagePreview = null
		this.form.patchValue({ profile: null })
		this.form.get('profile')?.updateValueAndValidity()
	}

	submit() {
		this.successMsg = ''
		this.errorMsg = ''
		if (this.form.invalid) {
			this.form.markAllAsTouched()
			return
		}

		this.loading = true
		this.auth
			.register(
				{
					cedula: this.f.cedula.value || '',
					name: this.f.name.value || '',
					lastName: this.f.lastName.value || '',
					email: this.f.email.value || '',
					password: this.f.password.value || '',
					confirmPassword: this.f.confirmPassword.value || '',
					address: this.f.address.value || '',
				},
				this.selectedFile
			)
			.subscribe({
				next: (res) => {
					this.successMsg = res?.message || 'Registro exitoso'
					this.form.reset()
							this.selectedFile = null
							this.imagePreview = null
					this.loading = false
				},
				error: (err: HttpErrorResponse) => {
					const msg = (err.error && (err.error.message || err.error.error)) || err.message
					this.errorMsg = msg || 'Error al registrar'
					this.loading = false
				},
			})
	}
}
