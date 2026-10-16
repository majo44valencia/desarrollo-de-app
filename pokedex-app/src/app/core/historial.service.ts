import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { PokemonResumen } from './pokemon.service';

export interface Escaneo extends PokemonResumen {
  fecha: number;
}

/** Pokémon escaneados por cada usuario, guardados en el celular. */
@Injectable({ providedIn: 'root' })
export class HistorialService {
  private auth = inject(AuthService);
  private version = signal(0);

  readonly escaneos = computed<Escaneo[]>(() => {
    this.version();
    const clave = this.clave();
    return clave ? JSON.parse(localStorage.getItem(clave) ?? '[]') : [];
  });

  agregar(p: PokemonResumen) {
    const clave = this.clave();
    if (!clave) return;
    const lista = [{ ...p, fecha: Date.now() }, ...this.escaneos().filter((e) => e.id !== p.id)];
    localStorage.setItem(clave, JSON.stringify(lista));
    this.version.update((v) => v + 1);
  }

  borrar() {
    const clave = this.clave();
    if (clave) localStorage.removeItem(clave);
    this.version.update((v) => v + 1);
  }

  private clave() {
    const u = this.auth.user();
    return u ? `pk_historial_${u.email}` : null;
  }
}
