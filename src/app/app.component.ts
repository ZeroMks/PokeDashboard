import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// 1. Importa tu componente aquí
import { DashboardComponent } from './dashboard/dashboard.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  // 2. Añado DashboardComponent al array de imports
  imports: [ DashboardComponent], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Actividad2';
}