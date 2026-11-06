import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'passenger-home',
    canActivate: [authGuard],
    loadComponent: () => import('./passenger-home/passenger-home.page').then((m) => m.PassengerHomePage),
  },
  {
    path: 'driver-dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./driver-dashboard/driver-dashboard.page').then((m) => m.DriverDashboardPage),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];