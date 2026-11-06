import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, ToastController 
} from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem, 
    IonLabel, IonInput, IonButton
  ]
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  async onLogin() {
    if (!this.email || !this.password) {
      this.showToast('Por favor ingresa tu correo y contraseña', 'warning');
      return;
    }

    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showToast(`¡Bienvenido ${res.user.name}!`, 'success');
        
        // Redirección según rol obtenido
        if (res.user.role === 'driver') {
          this.router.navigate(['/driver-dashboard']);
        } else {
          this.router.navigate(['/passenger-home']);
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error en login:', err);
        const msg = err.error?.message || 'Error de autenticación';
        this.showToast(msg, 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}