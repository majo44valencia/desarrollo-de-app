import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { config } from '../config';
import { PokemonResumen, PokemonService } from './pokemon.service';

export const geminiConfigurado = !config.geminiApiKey.startsWith('PEGA_AQUI');

const PROMPT = `Eres un experto en Pokémon. En la imagen hay un Pokémon (puede ser una foto de una pantalla,
una carta, un dibujo, un peluche o una figura). Identifica cuál es.
Responde SOLO con JSON con este formato:
{"pokemon": "<nombre en inglés tal como aparece en la PokeAPI, en minúsculas, ej: pikachu, mr-mime, nidoran-f>", "confianza": <número de 0 a 1>}
Si en la imagen no hay ningún Pokémon responde {"pokemon": null, "confianza": 0}.`;

export interface ResultadoEscaneo {
  pokemon: PokemonResumen;
  confianza: number;
  foto: string;
}

@Injectable({ providedIn: 'root' })
export class EscanerService {
  private pokemon = inject(PokemonService);

  /** Abre la cámara y devuelve la foto en base64 (o null si el usuario cancela). */
  async tomarFoto(source = CameraSource.Camera): Promise<string | null> {
    try {
      const foto = await Camera.getPhoto({
        source,
        resultType: CameraResultType.Base64,
        quality: 70,
        width: 1024,
        correctOrientation: true,
      });
      return foto.base64String ?? null;
    } catch (e) {
      if (String((e as Error)?.message ?? e).toLowerCase().includes('cancel')) return null;
      throw e;
    }
  }

  /** Prueba los modelos en orden; si uno está saturado o no existe, pasa al siguiente. */
  private async llamarGemini(base64: string) {
    const body = JSON.stringify({
      contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: base64 } }, { text: PROMPT }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 },
    });
    let ultimoError = '';
    for (const modelo of config.geminiModelos) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiApiKey },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data;
      ultimoError = data?.error?.message ?? res.statusText;
      if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(ultimoError))) {
        throw new Error(`La clave de Gemini no es válida: ${ultimoError}`);
      }
      // 429 (límite), 503 (saturado), 404 (modelo retirado): probar el siguiente modelo.
    }
    throw new Error('La IA está saturada en este momento. Espera unos segundos e intenta otra vez.');
  }

  /** Envía la foto a Gemini, que dice qué Pokémon es, y lo busca en la PokeAPI. */
  async reconocer(base64: string): Promise<ResultadoEscaneo> {
    if (!geminiConfigurado) {
      throw new Error('Falta pegar la clave de Gemini en src/app/config.ts');
    }
    const data = await this.llamarGemini(base64);
    const texto: string = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
    let respuesta: { pokemon: string | null; confianza?: number };
    try {
      respuesta = JSON.parse(texto.replace(/```json|```/g, '').trim());
    } catch {
      throw new Error('No se entendió la respuesta de la IA. Intenta de nuevo.');
    }
    if (!respuesta.pokemon) {
      throw new Error('No se encontró ningún Pokémon en la foto. Acércate más a la imagen.');
    }
    const encontrado = await this.pokemon.buscarPorNombre(respuesta.pokemon);
    if (!encontrado) {
      throw new Error(`La IA dijo "${respuesta.pokemon}" pero no aparece en la Pokédex.`);
    }
    return { pokemon: encontrado, confianza: respuesta.confianza ?? 0, foto: base64 };
  }
}
