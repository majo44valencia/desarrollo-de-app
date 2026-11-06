import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, IonSegment, IonSegmentButton,
  IonButtons, IonBackButton, ToastController 
} from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonHeader, IonTitle, IonToolbar, IonItem, 
    IonLabel, IonInput, IonButton, IonSegment, IonSegmentButton,
    IonButtons, IonBackButton
  ]
})
export class RegisterPage {
  name = '';
  email = '';
  phone = '';
  password = '';
  role: 'passenger' | 'driver' = 'passenger';
  plate = '';
  vehicle_model = '';
  loading = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  async onRegister() {
    if (!this.name || !this.email || !this.password) {
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;
    const payload: any = {
      name: this.name,
      email: this.email,
      phone: this.phone,
      password: this.password,
      role: this.role
    };

    if (this.role === 'driver') {
      payload.plate = this.plate;
      payload.vehicle_model = this.vehicle_model;
    }

    this.authService.register(payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.showToast('¡Registro enviado!', 'success');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error devuelto por la API:', err);
        const mensajeError = err.error?.message || `Error ${err.status}: Backend unreachable`;
        this.showToast(mensajeError, 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}