import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class CommunityService {
	private readonly baseApi = 'http://localhost:3000/api/auth'

	constructor(private http: HttpClient) {}

	getCommunities(cedula: string): Observable<any> {
		return this.http.get<any>(`${this.baseApi}/communities/${cedula}`)
	}
}
