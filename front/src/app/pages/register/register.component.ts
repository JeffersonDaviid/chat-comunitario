import { Component, inject, OnInit } from '@angular/core'
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
export class RegisterComponent implements OnInit {
	fb = inject(FormBuilder)
	auth = inject(AuthService)

	loading = false
	successMsg = ''
	errorMsg = ''
	selectedFile: File | null = null
	imagePreview: string | null = null // Para la previsualización de la imagen
	imageError = ''
	locationError = ''
	locationLoading = false
	hasLocation = false

	form = this.fb.group(
		{
			cedula: ['', [Validators.required, this.ecuadorianIdValidator]],
			name: ['', [Validators.required]],
			lastName: ['', [Validators.required]],
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(6)]],
			confirmPassword: ['', [Validators.required]],
			phone: ['', [Validators.required, Validators.pattern(/^09\d{8}$/)]],
			address: ['', [Validators.required]],
			latitude: [null as number | null, [Validators.required]],
			longitude: [null as number | null, [Validators.required]],
			profile: [null as File | null],
		},
		{ validators: [this.passwordsMatchValidator] }
	)

	private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
		const pwd = group.get('password')?.value
		const conf = group.get('confirmPassword')?.value
		return pwd && conf && pwd !== conf ? { passwordsMismatch: true } : null
	}

	private ecuadorianIdValidator(control: AbstractControl): ValidationErrors | null {
		const cedula = control.value
		if (!cedula) return null
		
		if (!/^\d{10}$/.test(cedula)) {
			return { invalidId: 'La cédula debe tener 10 dígitos' }
		}
		
		const province = parseInt(cedula.substring(0, 2))
		if (province < 1 || province > 24) {
			return { invalidId: 'Código de provincia inválido' }
		}
		
		const digits = cedula.split('').map(Number)
		const verifier = digits[9]
		
		const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2]
		let sum = 0
		
		for (let i = 0; i < 9; i++) {
			let value = digits[i] * coefficients[i]
			if (value > 9) value -= 9
			sum += value
		}
		
		const calculatedVerifier = (10 - (sum % 10)) % 10
		return verifier === calculatedVerifier ? null : { invalidId: 'Cédula ecuatoriana inválida' }
	}

	get f() {
		return this.form.controls
	}

	ngOnInit() {
		// Obtener ubicación al cargar el componente
		this.getLocation()
	}

	getLocation() {
		this.locationLoading = true
		this.locationError = ''
		
		if (!navigator.geolocation) {
			this.locationError = 'Tu navegador no soporta geolocalización'
			this.locationLoading = false
			return
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				this.form.patchValue({
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				})
				this.hasLocation = true
				this.locationLoading = false
			},
			(error) => {
				let message = 'No se pudo obtener la ubicación'
				switch (error.code) {
					case error.PERMISSION_DENIED:
						message = 'Debes permitir el acceso a tu ubicación'
						break
					case error.POSITION_UNAVAILABLE:
						message = 'Ubicación no disponible'
						break
					case error.TIMEOUT:
						message = 'Tiempo de espera agotado'
						break
				}
				this.locationError = message
				this.locationLoading = false
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 0,
			}
		)
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
		
		if (!this.hasLocation) {
			this.errorMsg = 'Debes permitir el acceso a tu ubicación para registrarte'
			return
		}
		
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
					phone: this.f.phone.value || '',
					address: this.f.address.value || '',
					latitude: this.f.latitude.value || 0,
					longitude: this.f.longitude.value || 0,
				},
				this.selectedFile
			)
			.subscribe({
				next: (res) => {
					this.successMsg = res?.message || 'Registro exitoso'
					this.form.reset()
					this.selectedFile = null
					this.imagePreview = null
					this.hasLocation = false
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
