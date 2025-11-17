import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, Routes, Router } from '@angular/router'
import { inject } from '@angular/core'
import { AppComponent } from './app/app.component'
import { provideHttpClient } from '@angular/common/http'
import { withComponentInputBinding } from '@angular/router'
import { HomeComponent } from './app/pages/home/home.component'

// Guard sencillo: requiere 'user' en localStorage, si no redirige a /login
const authGuard = () => {
	const router = inject(Router)
	const hasUser = !!localStorage.getItem('user')
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
	providers: [provideRouter(routes, withComponentInputBinding()), provideHttpClient()],
}).catch((err) => {
	console.error('Error starting app:', err)
})
