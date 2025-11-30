import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private baseUrl = 'https://pokeapi.co/api/v2/pokemon';

  constructor(private http: HttpClient) { }

  // 1. Obtener la lista MAESTRA de nombres (Traemos 1000 para tener casi todos)
  getAllNames(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}?limit=1000`);
  }

  // 2. Obtener detalles de una lista específica de URLs (para los resultados de búsqueda)
  getDetalles(urls: string[]): Observable<any[]> {
    // Por cada URL, hacemos una petición get
    const peticiones = urls.map(url => this.http.get<any>(url));
    // forkJoin espera a que todas terminen y devuelve el array completo
    return forkJoin(peticiones) as Observable<any[]>;
  }
}