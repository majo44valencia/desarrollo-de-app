import { Component, computed, inject, input, resource } from '@angular/core';
import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonSpinner, IonToolbar } from '@ionic/angular';
import { PokemonService, STATS_ES, TIPOS } from '../../core/pokemon.service';

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: 'pokemon-detail.page.html',
  styleUrls: ['pokemon-detail.page.scss'],
  imports: [IonHeader, IonToolbar, IonButtons, IonBackButton, IonContent, IonSpinner, IonButton],
})
export class PokemonDetailPage {
  private pokemonService = inject(PokemonService);

  /** Vienen de la URL: /pokemon/:id?escaneado=1 */
  readonly id = input.required<string>();
  readonly escaneado = input<string>();

  readonly pokemon = resource({
    params: () => Number(this.id()),
    loader: ({ params }) => this.pokemonService.detalle(params),
  });

  readonly color = computed(() => TIPOS[this.pokemon.value()?.tipos[0] ?? '']?.color ?? '#e3350d');
  readonly tipos = TIPOS;
  readonly statsEs = STATS_ES;

  numero(id: number) {
    return '#' + String(id).padStart(4, '0');
  }

  porcentaje(valor: number) {
    return Math.min(100, Math.round((valor / 180) * 100));
  }
}
