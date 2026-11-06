import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TripRequest {
  id: number;
  passengerName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedPrice: number;
  pin: string;
  driverName?: string;
  status: 'PENDIENTE' | 'ACEPTADO' | 'EN_PROCESO' | 'FINALIZADO' | 'CANCELADO';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private STORAGE_KEY = 'corre_caminos_trips';
  private requestsSource = new BehaviorSubject<TripRequest[]>(this.loadFromStorage());
  requests$ = this.requestsSource.asObservable();

  private loadFromStorage(): TripRequest[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(requests: TripRequest[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(requests));
    this.requestsSource.next(requests);
  }

  private generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(1));
  }

  createRequest(
    passengerName: string, 
    origin: string, 
    destination: string, 
    coordsOrigin?: [number, number], 
    coordsDest?: [number, number]
  ): TripRequest {
    let distanceKm = 5;
    if (coordsOrigin && coordsDest) {
      distanceKm = this.calculateDistance(coordsOrigin[0], coordsOrigin[1], coordsDest[0], coordsDest[1]);
      if (distanceKm < 1) distanceKm = 1;
    }

    const calculatedPrice = Math.max(3000, Math.round(distanceKm * 1000 / 500) * 500);
    const pin = this.generatePin();

    const newRequest: TripRequest = {
      id: Date.now(),
      passengerName,
      origin,
      destination,
      distanceKm,
      estimatedPrice: calculatedPrice,
      pin,
      status: 'PENDIENTE',
      timestamp: new Date()
    };

    const current = this.requestsSource.value.filter(r => r.passengerName !== passengerName);
    const updated = [newRequest, ...current];
    this.saveToStorage(updated);
    return newRequest;
  }

  cancelRequest(passengerName: string) {
    const updated = this.requestsSource.value.filter(r => r.passengerName !== passengerName);
    this.saveToStorage(updated);
  }

  acceptRequest(id: number, driverName: string) {
    const updated = this.requestsSource.value.map(req => {
      if (req.id === id) {
        return { ...req, status: 'ACEPTADO' as const, driverName };
      }
      return req;
    });
    this.saveToStorage(updated);
  }

  verifyPin(id: number, inputPin: string): boolean {
  const currentRequests = this.requestsSource.value;
  // Convertimos ambos a String y usamos trim() para evitar espacios accidentales
  const trip = currentRequests.find(r => String(r.id) === String(id));
  
  if (trip && String(trip.pin).trim() === String(inputPin).trim()) {
    const updated = currentRequests.map(req => {
      if (String(req.id) === String(id)) {
        return { ...req, status: 'EN_PROCESO' as const };
      }
      return req;
    });
    this.saveToStorage(updated);
    return true;
  }
  return false;

  }
}