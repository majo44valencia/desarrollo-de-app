import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EpisodeResponse } from './episode.model';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
  private http = inject(HttpClient);

  getEpisodes(): Observable<EpisodeResponse> {
    return this.http.get<EpisodeResponse>('https://rickandmortyapi.com/api/episode');
  }
}