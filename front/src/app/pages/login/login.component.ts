import { Component, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms'
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http'
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service'

@Component({
	selector: 'login',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
	templateUrl: './login.component.html',
	styleUrl: './login.component.css',
})
export class LoginComponent {
	fb = inject(FormBuilder)
	auth = inject(AuthService)
	router = inject(Router)

	loading = false
	errorMsg = ''

	form = this.fb.group({
		email: ['', [Validators.required, Validators.email]],
		password: ['', [Validators.required]],
	})

	get f() {
		return this.form.controls
	}

	submit() {
		this.errorMsg = ''
		if (this.form.invalid) {
			this.form.markAllAsTouched()
			return
		}
		this.loading = true
		this.auth.login(this.f.email.value || '', this.f.password.value || '').subscribe({
			next: () => {
				this.loading = false
				this.router.navigateByUrl('/dashboard')
			},
			error: (err: HttpErrorResponse) => {
				const msg = (err.error && (err.error.message || err.error.error)) || err.message
				this.errorMsg = msg || 'Error al iniciar sesión'
				this.loading = false
			},
		})
	}
}
