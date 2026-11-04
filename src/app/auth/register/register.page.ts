import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, 
  IonLabel, IonInput, IonButton, IonSelect, IonSelectOption, 
  IonButtons, IonBackButton, ToastController 
} from '@ionic/angular';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, 
    IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton,
    IonSelect, IonSelectOption, IonButtons, IonBackButton
  ]
})
export class RegisterPage {
  name = '';
  email = '';
  phone = '';
  password = '';
  role = 'passenger';
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
        this.showToast('¡Cuenta registrada en la base de datos del profesor!', 'success');
        this.router.navigate(['/login']);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error devuelto por la API del profesor:', err);
        const mensajeError = err.error?.message || `Error ${err.status}: Ruta no encontrada o rechazada`;
        this.showToast(mensajeError, 'danger');
      }
    });
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 4000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}