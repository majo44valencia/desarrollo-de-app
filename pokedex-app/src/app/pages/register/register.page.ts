import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner, IonText } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline, personOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  styleUrls: ['../auth.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonIcon, IonSpinner, IonText],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  email = '';
  password = '';
  confirmar = '';
  cargando = signal(false);
  error = signal('');

  constructor() {
    addIcons({ personOutline, mailOutline, lockClosedOutline });
  }

  async registrar() {
    this.error.set('');
    if (this.password !== this.confirmar) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.registrar(this.nombre, this.email, this.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
}
