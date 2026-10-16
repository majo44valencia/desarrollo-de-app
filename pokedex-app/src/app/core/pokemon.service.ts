import { Injectable } from '@angular/core';

export interface PokemonResumen {
  id: number;
  nombre: string;
  imagen: string;
}

export interface PokemonDetalle extends PokemonResumen {
  tipos: string[];
  altura: number;
  peso: number;
  habilidades: string[];
  stats: { nombre: string; valor: number }[];
  descripcion: string;
  categoria: string;
}

const API = 'https://pokeapi.co/api/v2';
const TOTAL_POKEMON = 1025;

export function imagenPokemon(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

/** Normaliza nombres para compararlos: "Mr. Mime" -> "mrmime", "Farfetch'd" -> "farfetchd". */
export function normalizar(nombre: string) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .replace(/[^a-z0-9]/g, '');
}

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private todos?: Promise<PokemonResumen[]>;
  private cacheDetalle = new Map<number, Promise<PokemonDetalle>>();

  /** Lista completa (nombre e id), se descarga una sola vez. */
  listar(): Promise<PokemonResumen[]> {
    this.todos ??= fetch(`${API}/pokemon?limit=${TOTAL_POKEMON}`)
      .then((r) => r.json())
      .then((data: { results: { name: string; url: string }[] }) =>
        data.results.map((p) => {
          const id = Number(p.url.split('/').filter(Boolean).pop());
          return { id, nombre: p.name, imagen: imagenPokemon(id) };
        }),
      )
      .catch((e) => {
        this.todos = undefined;
        throw e;
      });
    return this.todos;
  }

  /** Busca un Pokémon por nombre (tolerante a mayúsculas, tildes y formas como "giratina-altered"). */
  async buscarPorNombre(nombre: string): Promise<PokemonResumen | undefined> {
    const objetivo = normalizar(nombre);
    if (!objetivo) return undefined;
    const lista = await this.listar();
    return (
      lista.find((p) => normalizar(p.nombre) === objetivo) ??
      lista.find((p) => normalizar(p.nombre.split('-')[0]) === objetivo) ??
      lista.find((p) => normalizar(p.nombre).startsWith(objetivo))
    );
  }

  detalle(id: number): Promise<PokemonDetalle> {
    if (!this.cacheDetalle.has(id)) {
      this.cacheDetalle.set(
        id,
        this.cargarDetalle(id).catch((e) => {
          this.cacheDetalle.delete(id);
          throw e;
        }),
      );
    }
    return this.cacheDetalle.get(id)!;
  }

  private async cargarDetalle(id: number): Promise<PokemonDetalle> {
    const [p, especie] = await Promise.all([
      fetch(`${API}/pokemon/${id}`).then((r) => r.json()),
      fetch(`${API}/pokemon-species/${id}`).then((r) => r.json()),
    ]);
    type Texto = { flavor_text: string; language: { name: string } };
    type Genero = { genus: string; language: { name: string } };
    const textos: Texto[] = especie.flavor_text_entries;
    const texto = textos.find((t) => t.language.name === 'es') ?? textos.find((t) => t.language.name === 'en');
    const generos: Genero[] = especie.genera;
    const genero = generos.find((g) => g.language.name === 'es') ?? generos.find((g) => g.language.name === 'en');
    return {
      id: p.id,
      nombre: p.name,
      imagen: imagenPokemon(p.id),
      tipos: p.types.map((t: any) => t.type.name),
      altura: p.height / 10,
      peso: p.weight / 10,
      habilidades: p.abilities.map((a: any) => a.ability.name),
      stats: p.stats.map((s: any) => ({ nombre: s.stat.name, valor: s.base_stat })),
      descripcion: texto?.flavor_text.replace(/[\n\f­]/g, ' ') ?? '',
      categoria: genero?.genus ?? '',
    };
  }
}

export const TIPOS: Partial<Record<string, { es: string; color: string }>> = {
  normal: { es: 'Normal', color: '#A8A77A' },
  fire: { es: 'Fuego', color: '#EE8130' },
  water: { es: 'Agua', color: '#6390F0' },
  electric: { es: 'Eléctrico', color: '#F7D02C' },
  grass: { es: 'Planta', color: '#7AC74C' },
  ice: { es: 'Hielo', color: '#96D9D6' },
  fighting: { es: 'Lucha', color: '#C22E28' },
  poison: { es: 'Veneno', color: '#A33EA1' },
  ground: { es: 'Tierra', color: '#E2BF65' },
  flying: { es: 'Volador', color: '#A98FF3' },
  psychic: { es: 'Psíquico', color: '#F95587' },
  bug: { es: 'Bicho', color: '#A6B91A' },
  rock: { es: 'Roca', color: '#B6A136' },
  ghost: { es: 'Fantasma', color: '#735797' },
  dragon: { es: 'Dragón', color: '#6F35FC' },
  dark: { es: 'Siniestro', color: '#705746' },
  steel: { es: 'Acero', color: '#B7B7CE' },
  fairy: { es: 'Hada', color: '#D685AD' },
};

export const STATS_ES: Partial<Record<string, string>> = {
  hp: 'PS',
  attack: 'Ataque',
  defense: 'Defensa',
  'special-attack': 'At. Esp.',
  'special-defense': 'Def. Esp.',
  speed: 'Velocidad',
};
