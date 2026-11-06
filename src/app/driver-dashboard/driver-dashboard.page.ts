import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
  IonCard, IonCardContent, IonBadge, IonInput, IonItem, ToastController 
} from '@ionic/angular';
import { AuthService } from '../services/auth';
import { TripService, TripRequest } from '../services/trip.service';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-driver-dashboard',
  templateUrl: './driver-dashboard.page.html',
  styleUrls: ['./driver-dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
    IonCard, IonCardContent, IonBadge, IonInput, IonItem
  ]
})
export class DriverDashboardPage implements OnInit, AfterViewInit {
  driverName = 'Paula';
  incomingRequests: TripRequest[] = [];
  inputPin: string = '';

  private map!: L.Map;
  private originMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;

  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastController = inject(ToastController);

  ngOnInit() {
    const user = this.authService.getUser();
    if (user && user.name) {
      this.driverName = user.name;
    }

    this.tripService.requests$.subscribe(requests => {
      this.incomingRequests = requests;
      if (requests.length > 0) {
        const latestTrip = requests[0];
        this.updateMapForTrip(latestTrip.origin, latestTrip.destination);
      }
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ionViewDidEnter() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 300);
    }
  }

  private initMap() {
    this.map = L.map('map-driver', { zoomControl: true }).setView([2.9273, -75.2819], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    L.Marker.prototype.options.icon = defaultIcon;
  }

  async updateMapForTrip(origin: string, destination: string) {
    try {
      const originCoords = await this.geocodeAddress(origin);
      const destCoords = await this.geocodeAddress(destination);

      if (originCoords && destCoords) {
        if (this.originMarker) this.map.removeLayer(this.originMarker);
        if (this.destMarker) this.map.removeLayer(this.destMarker);
        if (this.routeLine) this.map.removeLayer(this.routeLine);

        this.originMarker = L.marker(originCoords).addTo(this.map).bindPopup(`Recoger en: ${origin}`);
        this.destMarker = L.marker(destCoords).addTo(this.map).bindPopup(`Llevar a: ${destination}`);

        const routePoints = await this.getStreetRoute(originCoords, destCoords);

        if (routePoints && routePoints.length > 0) {
          this.routeLine = L.polyline(routePoints, {
            color: '#4caf50',
            weight: 6,
            opacity: 0.9
          }).addTo(this.map);

          const bounds = L.latLngBounds(routePoints);
          this.map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    } catch (e) {
      console.warn('Error mapa conductor:', e);
    }
  }

  private async geocodeAddress(address: string): Promise<[number, number] | null> {
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', Huila, Colombia')}`;
    try {
      const res: any = await this.http.get(searchUrl).toPromise();
      if (res && res.length > 0) {
        return [parseFloat(res[0].lat), parseFloat(res[0].lon)];
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }

  private async getStreetRoute(start: [number, number], end: [number, number]): Promise<[number, number][] | null> {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    try {
      const res: any = await this.http.get(url).toPromise();
      if (res && res.routes && res.routes.length > 0) {
        const coordinates = res.routes[0].geometry.coordinates;
        return coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      }
    } catch (err) {
      console.error('Error OSRM routing:', err);
    }
    return null;
  }

  acceptTrip(id: number) {
    this.tripService.acceptRequest(id, this.driverName);
    this.showToast('¡Viaje aceptado! Dirígete a recoger al pasajero.', 'success');
  }

  verifyAndStartTrip(id: number) {
    const isValid = this.tripService.verifyPin(id, this.inputPin);
    if (isValid) {
      this.showToast('¡PIN Correcto! Iniciando viaje.', 'success');
      this.inputPin = '';
    } else {
      this.showToast('PIN incorrecto. Pídeselo nuevamente al pasajero.', 'danger');
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message, duration: 3000, color, position: 'bottom'
    });
    toast.present();
  }
}