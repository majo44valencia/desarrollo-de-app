import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, IonItem, IonInput, 
  IonButton, ToastController 
} from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, IonContent, 
    IonItem, IonInput, IonButton
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
      this.showToast('Tukoyem amin a pagfill-apan', 'warning');
      return;
    }

    this.loading = true;
    (this.authService as any).login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showToast('¡Naimbag a panaglukat (Bienvenido)!', 'success');
        if (res.token) {
          localStorage.setItem('auth_token', res.token);
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.warn('Backend server unreachable. Simulating login...', err);
        this.showToast('¡Bienvenido! (Modo Simulación)', 'success');
        localStorage.setItem('auth_token', 'demo_token_123');
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