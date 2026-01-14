import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, Routes, Router } from '@angular/router'
import { inject } from '@angular/core'
import { AppComponent } from './app/app.component'
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http'
import { withComponentInputBinding } from '@angular/router'
import { HomeComponent } from './app/pages/home/home.component'
import { catchError } from 'rxjs/operators'
import { throwError } from 'rxjs'

// Interceptor funcional para manejar errores del backend
const authInterceptor: HttpInterceptorFn = (req, next) => {
	const router = inject(Router)
	
	return next(req).pipe(
		catchError((error) => {
			// Si el backend no responde (ERR_CONNECTION_REFUSED, timeout, etc.)
			if (error.status === 0 || error.status === 504 || error.status === 503) {
				console.warn('[Interceptor] Backend no disponible, limpiando sesión...')
				sessionStorage.clear()
				router.navigate(['/login'])
			}
			
			// Si hay error 401 Unauthorized, también limpiar sesión
			if (error.status === 401) {
				console.warn('[Interceptor] No autorizado, limpiando sesión...')
				sessionStorage.clear()
				router.navigate(['/login'])
			}

			return throwError(() => error)
		})
	)
}

// Guard sencillo: requiere 'user' en sessionStorage, si no redirige a /login
const authGuard = () => {
	const router = inject(Router)
	const hasUser = !!sessionStorage.getItem('user')
	return hasUser ? true : router.parseUrl('/login')
}

const routes: Routes = [
	{ path: '', component: HomeComponent },
	{
		path: 'dashboard',
		loadComponent: () =>
			import('./app/pages/dashboard/dashboard.component').then(
				(m) => m.DashboardComponent
			),
		canActivate: [authGuard],
	},
	{
		path: 'chat/:communityId/:channelId',
		loadComponent: () =>
			import('./app/components/chat/chat.component').then((m) => m.ChatComponent),
		canActivate: [authGuard],
	},
	{
		path: 'login',
		loadComponent: () =>
			import('./app/pages/login/login.component').then((m) => m.LoginComponent),
	},
	{
		path: 'register',
		loadComponent: () =>
			import('./app/pages/register/register.component').then((m) => m.RegisterComponent),
	},
]

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(routes, withComponentInputBinding()), 
		provideHttpClient(withInterceptors([authInterceptor]))
	],
}).catch((err) => {
	console.error('Error starting app:', err)
})
