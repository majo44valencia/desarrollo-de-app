// src/app/tab2/tab2.page.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhotoService } from '../services/photo.service';

// Si ar-viewer.component.ts está en src/app/ar-viewer.component.ts:
import { ArViewerComponent } from '../ar-viewer.component';

// (Si lo creaste dentro de src/app/components/ar-viewer/, usa esta línea en su lugar):
// import { ArViewerComponent } from '../components/ar-viewer/ar-viewer.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [CommonModule, ArViewerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class Tab2Page {
  public isArActive = false;

  constructor(public photoService: PhotoService) {}

  public openAR() {
    this.isArActive = true;
  }

  public closeAR() {
    this.isArActive = false;
  }
}