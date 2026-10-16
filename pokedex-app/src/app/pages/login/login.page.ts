import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner, IonText } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline } from 'ionicons/icons';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['../auth.scss'],
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonInputPasswordToggle, IonButton, IonIcon, IonSpinner, IonText],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  cargando = signal(false);
  error = signal('');

  constructor() {
    addIcons({ mailOutline, lockClosedOutline });
  }

  async ingresar() {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.auth.login(this.email, this.password);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.cargando.set(false);
    }
  }
}
