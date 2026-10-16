import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CameraSource } from '@capacitor/camera';
import {
  AlertController,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  LoadingController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imagesOutline, logOutOutline, scanOutline, trashOutline } from 'ionicons/icons';
import { AuthService } from '../core/auth.service';
import { EscanerService } from '../core/escaner.service';
import { HistorialService } from '../core/historial.service';
import { PokemonResumen, PokemonService, normalizar } from '../core/pokemon.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonSearchbar],
})
export class HomePage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private escaner = inject(EscanerService);
  private pokemonService = inject(PokemonService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  readonly historial = inject(HistorialService);

  readonly user = this.auth.user;
  readonly busqueda = signal('');
  private lista = signal<PokemonResumen[]>([]);

  readonly resultados = computed(() => {
    const q = normalizar(this.busqueda());
    if (!q) return [];
    return this.lista()
      .filter((p) => normalizar(p.nombre).includes(q) || String(p.id) === q)
      .slice(0, 30);
  });

  constructor() {
    addIcons({ logOutOutline, scanOutline, imagesOutline, trashOutline });
    this.pokemonService.listar().then((l) => this.lista.set(l)).catch(() => {});
  }

  async escanear(desdeGaleria = false) {
    const foto = await this.escaner
      .tomarFoto(desdeGaleria ? CameraSource.Photos : CameraSource.Camera)
      .catch((e) => {
        this.mostrarError('No se pudo abrir la cámara: ' + (e?.message ?? e));
        return null;
      });
    if (!foto) return;

    const loading = await this.loadingCtrl.create({ message: 'Analizando Pokémon…', spinner: 'circles' });
    await loading.present();
    try {
      const r = await this.escaner.reconocer(foto);
      this.historial.agregar(r.pokemon);
      await loading.dismiss();
      this.router.navigate(['/pokemon', r.pokemon.id], { queryParams: { escaneado: 1 } });
    } catch (e) {
      await loading.dismiss();
      this.mostrarError((e as Error).message);
    }
  }

  async borrarHistorial() {
    const alert = await this.alertCtrl.create({
      header: 'Borrar historial',
      message: '¿Seguro que quieres borrar todos tus Pokémon escaneados?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Borrar', role: 'destructive', handler: () => this.historial.borrar() },
      ],
    });
    await alert.present();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  numero(id: number) {
    return '#' + String(id).padStart(4, '0');
  }

  private async mostrarError(message: string) {
    const toast = await this.toastCtrl.create({ message, duration: 4000, color: 'danger', position: 'top' });
    await toast.present();
  }
}
