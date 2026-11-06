import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AuthResponse {
  token: string;
  user: {
    id: string | number;
    name: string;
    email: string;
    role: 'passenger' | 'driver';
    phone?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://20.20.1.42:8000/api';
  
  // ACTIVADO PARA TRABAJAR EN CASA (Si quieres probar con la IP del profe, cámbialo a false)
  private useMock = true; // Cambiar a true para usar respuestas simuladas

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string; role?: string }): Observable<AuthResponse> {
    if (this.useMock) {
      const isDriver = credentials.email.includes('driver') || credentials.email.includes('conductor');
      const mockResponse: AuthResponse = {
        token: 'fake-jwt-token-12345',
        user: {
          id: 1,
          name: credentials.email.split('@')[0],
          email: credentials.email,
          role: isDriver ? 'driver' : 'passenger'
        }
      };

      return of(mockResponse).pipe(
        tap(res => {
          localStorage.setItem('user_token', res.token);
          localStorage.setItem('user_role', res.user.role);
          localStorage.setItem('user', JSON.stringify(res.user));
        })
      );
    } else {
      return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
        tap(res => {
          if (res.token) {
            localStorage.setItem('user_token', res.token);
            localStorage.setItem('user_role', res.user.role);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        })
      );
    }
  }

  register(userData: any): Observable<any> {
    if (this.useMock) {
      return of({ message: 'Usuario registrado con éxito (Mock)', user: userData });
    } else {
      return this.http.post<any>(`${this.apiUrl}/register`, userData);
    }
  }

  logout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}