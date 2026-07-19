import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'insightflow_token';
  private readonly userKey = 'insightflow_user';
  readonly user = signal<User | null>(this.readUser());
  readonly isAuthenticated = computed(() => Boolean(this.token && this.user()));

  get token(): string | null { return localStorage.getItem(this.tokenKey); }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(tap(response => this.persist(response)));
  }

  register(payload: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap(response => this.persist(response)));
  }

  refreshMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`)
      .pipe(tap(user => {
        this.user.set(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }));
  }

  logout(redirect = true): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  private persist(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.user.set(response.user);
  }

  private readUser(): User | null {
    try {
      const value = localStorage.getItem(this.userKey);
      return value ? JSON.parse(value) as User : null;
    } catch {
      return null;
    }
  }
}
