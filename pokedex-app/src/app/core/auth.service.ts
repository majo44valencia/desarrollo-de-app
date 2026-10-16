import { Injectable, signal } from '@angular/core';

export interface Usuario {
  nombre: string;
  email: string;
}

interface UsuarioGuardado extends Usuario {
  hash: string;
}

const KEY_USUARIOS = 'pk_usuarios';
const KEY_SESION = 'pk_sesion';

/** Login local: los usuarios se guardan en el celular (localStorage), la contraseña cifrada con SHA-256. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<Usuario | null>(this.leerSesion());

  async registrar(nombre: string, email: string, password: string) {
    email = email.trim().toLowerCase();
    nombre = nombre.trim();
    if (!nombre) throw new Error('Escribe tu nombre.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('El correo no es válido.');
    if (password.length < 6) throw new Error('La contraseña debe tener mínimo 6 caracteres.');
    const usuarios = this.leerUsuarios();
    if (usuarios[email]) throw new Error('Ya existe una cuenta con ese correo.');
    usuarios[email] = { nombre, email, hash: await sha256(email + password) };
    localStorage.setItem(KEY_USUARIOS, JSON.stringify(usuarios));
    this.iniciarSesion({ nombre, email });
  }

  async login(email: string, password: string) {
    email = email.trim().toLowerCase();
    const u = this.leerUsuarios()[email];
    if (!u || u.hash !== (await sha256(email + password))) {
      throw new Error('Correo o contraseña incorrectos.');
    }
    this.iniciarSesion({ nombre: u.nombre, email: u.email });
  }

  logout() {
    localStorage.removeItem(KEY_SESION);
    this.user.set(null);
  }

  private iniciarSesion(u: Usuario) {
    localStorage.setItem(KEY_SESION, JSON.stringify(u));
    this.user.set(u);
  }

  private leerUsuarios(): Record<string, UsuarioGuardado> {
    return JSON.parse(localStorage.getItem(KEY_USUARIOS) ?? '{}');
  }

  private leerSesion(): Usuario | null {
    return JSON.parse(localStorage.getItem(KEY_SESION) ?? 'null');
  }
}

async function sha256(texto: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
