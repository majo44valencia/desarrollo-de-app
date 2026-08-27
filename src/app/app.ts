import { Component, inject, signal, OnInit } from '@angular/core';
import { EpisodeService } from './episode.service';
import { Episode } from './episode.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private service = inject(EpisodeService);
  
  episodes = signal<Episode[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.service.getEpisodes().subscribe({
      next: (res) => {
        this.episodes.set(res.results);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}