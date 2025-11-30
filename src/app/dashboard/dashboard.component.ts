import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
// IMPORTANTE: Asegúrate de importar el servicio correcto
import { PokemonService } from '../services/pokemon.service'; 
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
// ... imports (igual que antes)

export class DashboardComponent implements OnInit {
  datos: any[] = [];         // Los datos que se ven en la tabla/gráfico
  masterList: any[] = [];    // La lista completa de 1000 nombres (invisible)
  
  cargando: boolean = true;
  error: string | null = null;
  chart: any;
  chartExperiencia: any;
  chartStats: any;
  busqueda: string = '';
  private searchTimer: any;
  modoNivel100: boolean = false;
 

  constructor(private pokemonService: PokemonService) {}

  ngOnInit(): void {
    // Al iniciar, cargamos la lista maestra y luego mostramos los primeros 10
    this.cargarListaMaestra();
  }

  cargarListaMaestra() {
    this.cargando = true;
    this.pokemonService.getAllNames().subscribe({
      next: (res: any) => {
        this.masterList = res.results; // Guardamos los 1000 nombres y URLs
        // Mostramos los 10 primeros por defecto
        this.cargarDetalles(this.masterList.slice(0, 9));
      },
      error: () => {
        this.error = 'Error al cargar la lista de Pokémon.';
        this.cargando = false;
      }
    });
  }

  // Función auxiliar para pedir los detalles de una lista de pokemons
  cargarDetalles(lista: any[]) {
    // Extraemos solo las URLs de la lista que nos pasen
    const urls = lista.map(item => item.url);

    this.pokemonService.getDetalles(urls).subscribe({
      next: (detalles) => {
        this.datos = detalles;
        this.cargando = false;
        setTimeout(() => this.renderizarGrafico(), 0);
      },
      error: () => {
        this.error = 'Error al cargar detalles.';
        this.cargando = false;
      }
    });
  }

 

  // NUEVA LÓGICA DE BÚSQUEDA INTELIGENTE
  buscar() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    // 2. Iniciamos una nueva cuenta atrás de 300ms
    this.searchTimer = setTimeout(() => {
      
      // AQUÍ EMPIEZA LA LÓGICA DE SIEMPRE
      const termino = this.busqueda.trim().toLowerCase();

      if (!termino) {
        this.cargarDetalles(this.masterList.slice(0, 9));
        return;
      }

      const coincidencias = this.masterList.filter(p => p.name.includes(termino));

      if (coincidencias.length === 0) {
        this.error = "No hay coincidencias con esa búsqueda.";
        this.datos = [];
        // Importante: Destruir gráficos si no hay datos para evitar residuos
        if(this.chartExperiencia) this.chartExperiencia.destroy();
        if(this.chartStats) this.chartStats.destroy();
      } else {
        this.error = null;
        this.cargando = true;
        this.cargarDetalles(coincidencias.slice(0, 10));
      }

    }, 300);
  }

  renderizarGrafico() {
    this.renderizarExperiencia();
    this.renderizarStats();
  }

  renderizarExperiencia() {
    const ctx = document.getElementById('graficoExperiencia') as HTMLCanvasElement;
    if (ctx) {
      if (this.chartExperiencia) this.chartExperiencia.destroy();

      this.chartExperiencia = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.datos.map(d => d.name),
          datasets: [{
            label: 'Exp. Base',
            data: this.datos.map(d => d.base_experience),
            // Usamos colores pastel para que no moleste a la vista
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
              '#FF9F40', '#E7E9ED', '#71B37C', '#2A3F55', '#D35400'
            ],
            borderWidth: 0,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false } // Ocultamos leyenda para ahorrar espacio
          }
        }
      });
    }
  }
  toggleModoStats() {
    this.modoNivel100 = !this.modoNivel100;
    this.renderizarStats(); // Volvemos a pintar el gráfico con los nuevos datos
  }

  renderizarStats() {
    const ctx = document.getElementById('graficoStats') as HTMLCanvasElement;
    
    // FUNCIÓN DE CÁLCULO:
    // Si modoNivel100 es true, aplicamos la fórmula: (Base * 2) + 99
    // Si es false, dejamos la base tal cual.
    const calcularStat = (base: number) => {
      return this.modoNivel100 ? (base * 2 + 99) : base;
    };

    // Aplicamos el cálculo a los arrays
    const ataques = this.datos.map(p => {
      const base = p.stats.find((s:any) => s.stat.name === 'attack').base_stat;
      return calcularStat(base);
    });
    
    const defensas = this.datos.map(p => {
      const base = p.stats.find((s:any) => s.stat.name === 'defense').base_stat;
      return calcularStat(base);
    });

    // ... (El resto del código de configuración del gráfico es IGUAL) ...
    
    if (ctx) {
      if (this.chartStats) this.chartStats.destroy();

      this.chartStats = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.datos.map(d => d.name),
          datasets: [
            {
              // Cambiamos el texto de la etiqueta según el modo
              label: this.modoNivel100 ? 'Ataque (Lvl 100)' : 'Ataque Base',
              data: ataques,
              backgroundColor: 'rgba(239, 68, 68, 0.7)',
              borderColor: '#ef4444',
              borderWidth: 1
            },
            {
              label: this.modoNivel100 ? 'Defensa (Lvl 100)' : 'Defensa Base',
              data: defensas,
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: '#3b82f6',
              borderWidth: 1
            }
            // ... (Velocidad si la tienes)
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { 
              beginAtZero: true,
              // Importante: Si mostramos nivel 100, los valores suben a 300-400, 
              // el gráfico se adaptará solo gracias a Chart.js
            }, 
            x: { grid: { display: false } }
          },
          animation: {
            duration: 500 // Animación suave al cambiar de modo
          }
        }
      });
    }
  }
}