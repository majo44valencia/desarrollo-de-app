import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
  HostListener,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@Component({
  selector: 'app-ar-viewer',
  templateUrl: './ar-viewer.component.html',
  styleUrls: ['./ar-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ArViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('containerElement', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  @Output() close = new EventEmitter<void>();

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private mediaStream: MediaStream | null = null;

  private sofaGroup: THREE.Group = new THREE.Group();
  public isAnchored = false;

  // Handler para desenganchar el evento al cambiar de pestaña
  private boundOrientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;

  ngAfterViewInit() {
    this.initCameraFeed();
    this.initThreeJS();
    this.loadSofaModel();
    this.initGyroscope();
    this.animate();
  }

  ngOnDestroy() {
    this.cleanUpResources();
  }

  // 1. Activar cámara trasera del celular
  private async initCameraFeed() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: 'environment' } }
      }).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      });

      if (this.videoRef?.nativeElement && this.mediaStream) {
        this.videoRef.nativeElement.srcObject = this.mediaStream;
        await this.videoRef.nativeElement.play();
      }
    } catch (err) {
      console.error('Error al inicializar cámara de video:', err);
    }
  }

  // 2. Configurar motor 3D
  private initThreeJS() {
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Luces de la escena
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(2, 5, 3);
    this.scene.add(dirLight);

    // Posición inicial del sofá frente al lente
    this.sofaGroup.position.set(0, -0.8, -2.5);
    this.scene.add(this.sofaGroup);
  }

  private loadSofaModel() {
    const loader = new GLTFLoader();
    loader.load(
      'assets/models/sofa.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        this.sofaGroup.add(model);
      },
      undefined,
      () => {
        // Figura alternativa de respaldo si el .glb no se encuentra
        this.createPlaceholderSofa();
      }
    );
  }

  private createPlaceholderSofa() {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ color: 0x2563eb });

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 0.8), material);
    seat.position.y = 0.15;

    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.2), material);
    back.position.set(0, 0.5, -0.3);

    group.add(seat, back);
    this.sofaGroup.add(group);
  }

  // 3. Giroscopio: Al mover el celular, la cámara 3D gira en el mundo virtual
  private initGyroscope() {
    this.boundOrientationHandler = (event: DeviceOrientationEvent) => {
      if (event.alpha === null || event.beta === null || event.gamma === null) return;

      const alpha = THREE.MathUtils.degToRad(event.alpha);
      const beta = THREE.MathUtils.degToRad(event.beta);
      const gamma = THREE.MathUtils.degToRad(event.gamma);

      // Convertir rotación del sensor físico a la orientación de la cámara 3D
      const euler = new THREE.Euler(beta, alpha, -gamma, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
    };

    window.addEventListener('deviceorientation', this.boundOrientationHandler, true);
  }

  // 4. Lógica de Anclaje
  public fixSofaInPlace(event?: Event) {
    if (event) event.stopPropagation();
    // Al congelar el sofá, sus coordenadas X, Y, Z se quedan fijas en el espacio 3D
    this.isAnchored = true;
  }

  public unfixSofa(event?: Event) {
    if (event) event.stopPropagation();
    this.isAnchored = false;
  }

  // Si NO está fijado, el sofá se desplaza frente a la mira de la cámara
  private updateAimPosition() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    const target = this.camera.position.clone().add(dir.multiplyScalar(2.5));
    target.y = -0.8;

    this.sofaGroup.position.copy(target);
  }

  // 5. Ciclo de Animación
  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);

    if (!this.isAnchored) {
      this.updateAimPosition();
    }

    this.renderer.render(this.scene, this.camera);
  };

  @HostListener('window:resize')
  public onWindowResize() {
    if (!this.containerRef || !this.renderer || !this.camera) return;
    const width = this.containerRef.nativeElement.clientWidth;
    const height = this.containerRef.nativeElement.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // 6. Limpieza Total al salir para evitar cuelgues en Tab 2
  private cleanUpResources() {
    if (this.animFrameId !== null) cancelAnimationFrame(this.animFrameId);

    if (this.boundOrientationHandler) {
      window.removeEventListener('deviceorientation', this.boundOrientationHandler, true);
      this.boundOrientationHandler = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  public onClose() {
    this.cleanUpResources();
    this.close.emit();
  }
}