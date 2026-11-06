import { Component, inject, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
  IonItem, IonLabel, IonInput, IonCard, IonCardContent, IonCardHeader, 
  IonCardTitle, IonBadge, ToastController 
} from '@ionic/angular';
import { AuthService } from '../services/auth';
import { TripService, TripRequest } from '../services/trip.service';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';

@Component({
  selector: 'app-passenger-home',
  templateUrl: './passenger-home.page.html',
  styleUrls: ['./passenger-home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
    IonItem, IonLabel, IonInput, IonCard, IonCardContent, IonCardHeader, 
    IonCardTitle, IonBadge
  ]
})
export class PassengerHomePage implements OnInit, AfterViewInit {
  userName = 'maria_valenciara';
  origin = 'Brisas Neiva';
  destination = 'Centro Neiva';
  activeTrip: TripRequest | null = null;
  
  private map!: L.Map;
  private originMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private routeLine: L.Polyline | null = null;
  private originCoords: [number, number] | null = null;
  private destCoords: [number, number] | null = null;

  private authService = inject(AuthService);
  private tripService = inject(TripService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastController = inject(ToastController);

  ngOnInit() {
    const user = this.authService.getUser();
    if (user && user.name) {
      this.userName = user.name;
    }

    this.tripService.requests$.subscribe(requests => {
      const myTrip = requests.find(r => r.passengerName === this.userName);
      this.activeTrip = myTrip || null;
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
    this.map = L.map('map-passenger', { zoomControl: true }).setView([2.9273, -75.2819], 12);

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

    this.updateRouteOnMap();
  }

  async updateRouteOnMap() {
    if (!this.origin || !this.destination) return;

    try {
      this.originCoords = await this.geocodeAddress(this.origin);
      this.destCoords = await this.geocodeAddress(this.destination);

      if (this.originCoords && this.destCoords) {
        // Limpiar elementos previos en el mapa
        if (this.originMarker) this.map.removeLayer(this.originMarker);
        if (this.destMarker) this.map.removeLayer(this.destMarker);
        if (this.routeLine) this.map.removeLayer(this.routeLine);

        // Marcadores de origen y destino
        this.originMarker = L.marker(this.originCoords).addTo(this.map).bindPopup(`Origen: ${this.origin}`);
        this.destMarker = L.marker(this.destCoords).addTo(this.map).bindPopup(`Destino: ${this.destination}`);

        // OBTENER LA RUTA POR CALLES VIA OSRM
        const routePoints = await this.getStreetRoute(this.originCoords, this.destCoords);

        if (routePoints && routePoints.length > 0) {
          // Dibujar la línea sobre las calles
          this.routeLine = L.polyline(routePoints, {
            color: '#ff9800',
            weight: 6,
            opacity: 0.9
          }).addTo(this.map);

          const bounds = L.latLngBounds(routePoints);
          this.map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    } catch (e) {
      console.warn('Error al actualizar ruta por calles:', e);
    }
  }

  // Geocodificación del texto a coordenadas (Lat, Lon)
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

  // Servicio de OSRM para traer los puntos exactos de las calles
  private async getStreetRoute(start: [number, number], end: [number, number]): Promise<[number, number][] | null> {
    // Formato OSRM: lon,lat;lon,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    try {
      const res: any = await this.http.get(url).toPromise();
      if (res && res.routes && res.routes.length > 0) {
        // Convertir coordenadas [lon, lat] de GeoJSON a [lat, lon] de Leaflet
        const coordinates = res.routes[0].geometry.coordinates;
        return coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
      }
    } catch (err) {
      console.error('Error OSRM routing:', err);
    }
    return null;
  }

  requestTrip() {
    if (!this.origin || !this.destination) {
      this.showToast('Ingresa origen y destino', 'warning');
      return;
    }

    this.tripService.createRequest(
      this.userName, 
      this.origin, 
      this.destination,
      this.originCoords || undefined,
      this.destCoords || undefined
    );

    this.showToast('¡Solicitud enviada a conductores!', 'success');
  }

  cancelTrip() {
    this.tripService.cancelRequest(this.userName);
    this.showToast('Solicitud cancelada', 'danger');
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