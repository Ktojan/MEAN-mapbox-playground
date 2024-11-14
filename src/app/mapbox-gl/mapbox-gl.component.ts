// --------------------------- ANGULAR  ----------------- //
import { Component, ElementRef, inject, TemplateRef, ViewChild } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Default3DbuildingsConfig, MapboxService } from './mapbox.service';
import { BehaviorSubject } from 'rxjs';
// --------------------------- MAPBOX stuff and files ----------------- //
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { MercatorCoordinate, Map } from 'mapbox-gl';

@Component({
  selector: 'app-mapbox-gl',
  standalone: true,
  imports: [NgxMapboxGLModule, NgForOf, NgIf, FormsModule, MatDialogModule,
  MatButtonModule, MatSlideToggleModule,  AsyncPipe],
  templateUrl: './mapbox-gl.component.html',
  styleUrl: './mapbox-gl.component.scss'
})
export class MapboxGlComponent {
  @ViewChild('embededvideo') videoElement: ElementRef<any>;
  @ViewChild('tokenModal') tokenModal: TemplateRef<HTMLElement>;

  dialog = inject(MatDialog);
  tokenDialogRef: MatDialogRef<any>;
  mapboxService = inject(MapboxService);
  Public_TOKEN$ = new BehaviorSubject(this.mapboxService.Public_TOKEN);
  Theather_coords = [30.74119, 46.48552];
  map: Map;
  config = {
    mapStyle: 'mapbox://styles/mapbox/streets-v9',
    interactive: false,
    projection: { name: 'mercator' },
    currentZoom: 18.3,
    pitch: 47,
    bearing: -111,
    cursorStyle: 'grab',
    paints: {
      d3buildings: Default3DbuildingsConfig
    },
    secondsBeforeToggleModes: 4
  }
  showMap = true;
  errorMessage = '';
  videoIsVisible = false;
  animationIsStopped = true;

  mapCreation(mapInstance: Map) {
    this.map = mapInstance;
    console.log('Mapbox-gl map created: ', mapInstance);    
    this.map.on('error', (errorMessage) => {
      console.error('A error event occurred.', errorMessage);
    });
  }

  onZoomEnd(mapInstance: Map) {
    this.config.currentZoom = mapInstance.getZoom().toFixed(1);
  }

  onPitchEnd(mapInstance: Map) {
    this.config.pitch = mapInstance.getPitch().toFixed(1);
  }

  onBearingEnd(mapInstance: Map) {
    this.config.bearing = mapInstance.getBearing().toFixed(1);
  }

  toggleCameraAnimation(event) {
    if (event.checked) {
      this.videoIsVisible = true;
      if (this.config.interactive) {
        this.config.interactive = false;
        this.rerenderMap();
      }
      setTimeout(() => {
        this.startCameraAnimation();
        this.animationIsStopped = false;
      }, 1000) // give time to load and autoplay video, todo: onload event
    }
    else {
      this.stopCameraAnimation();
    }
  }

  updateCameraPosition(position, altitude, target) {
    const camera = this.map.getFreeCameraOptions();
    camera.position = MercatorCoordinate.fromLngLat( position, altitude );
    camera.lookAtPoint(target);
    this.map.setFreeCameraOptions(camera);
  }

  stopCameraAnimation() {
    this.animationIsStopped = true;
    this.videoIsVisible = false;
    this.config.interactive = true;
    this.rerenderMap();
  }

  startCameraAnimation() {
    let animationIndex = 0;
    let animationTime = 0.0;

    // linearly interpolate between two altitudes/positions based on time
    function linearInterpolation(a, b, t) {
      if (Array.isArray(a) && Array.isArray(b)) {
        const result = [];
        for (let i = 0; i < Math.min(a.length, b.length); i++)
          result[i] = a[i] * (1.0 - t) + b[i] * t;
        return result;
      } else {
        return a * (1.0 - t) + b * t;
      }
    };

    const right_rear_corner = [30.743242769728795, 46.48629718326552],
      right_rear_fountain = [30.742833472780717, 46.48548962682534],   
      left_rear_corner = [30.740706449423357, 46.48705883511292],
      left_front_corner = [30.738426193294828, 46.48467793856926],
      alt_initial = 190.0, alt_middle = 350, alt_final = 330;

    const animations = [
      {
        duration: 3000.0,
        animate: (phase) => {
          const start = right_rear_fountain, end = right_rear_corner;
          const alt = [alt_initial, alt_middle];
          // interpolate camera position while keeping focus on a target lat/lng
          const position = linearInterpolation(start, end, phase);
          const altitude = linearInterpolation(alt[0], alt[1], phase);
          this.updateCameraPosition(position, altitude, this.Theather_coords);
        }
      },
      {
        duration: 6000.0,
        animate: (phase) => {
          const start = right_rear_corner, end = left_rear_corner;
          const alt = [alt_middle, alt_middle];
          const position = linearInterpolation(start, end, phase);
          const altitude = linearInterpolation(alt[0], alt[1], phase);
          this.updateCameraPosition(position, altitude, this.Theather_coords);
        }
      },
      {
        duration: 8000.0,
        animate: (phase) => {
          const start = left_rear_corner, end = left_front_corner;
          const alt = [alt_middle, alt_final];
          const position = linearInterpolation(start, end, phase);
          const altitude = linearInterpolation(alt[0], alt[1], phase);
          this.updateCameraPosition(position, altitude, this.Theather_coords);
        }
      },
    ];
    let lastTime = (document.timeline.currentTime as number) || 0;

    function frameCustomFunction(timestamp) {
      if (this.animationIsStopped) return;
      animationIndex %= animations.length;
      const current = animations[animationIndex];
      let animPhase;
      if (animationTime < current.duration) {
        // Normalize the duration between 0 and 1 to interpolate the animation
        animPhase = animationTime / current.duration;
        // log info for each one of 250 animation frames
        if (Math.round(animationTime) % 250 == 0) console.log('Animation number ', (animationIndex+1) + ' \n phase: ' + (animPhase * 100).toFixed(1) + '% \n  ms passed from start: ' + Math.round(animationTime));
        current.animate(animPhase);
      }

      const elapsed = timestamp - lastTime;
      animationTime += elapsed;
      lastTime = timestamp;

      if (animationTime > current.duration) {
        animationIndex++;
        animationTime = 0.0;
        console.log(`---- START ANIMATION ${animationIndex} ------`)
      }

      const animationId = window.requestAnimationFrame(frameCustomFunction.bind(this));
      if (animationIndex == animations.length && animPhase > 0.99) {
        window.cancelAnimationFrame(animationId);
        setTimeout(() => this.stopCameraAnimation(), 1000 * this.config.secondsBeforeToggleModes);
      }
    }
    window.requestAnimationFrame(frameCustomFunction.bind(this));
  }

  mapErrorHandler(event) {
    console.error(event.error.message);
    if (event.error.status == 401) this.tokenDialogRef = this.dialog.open(this.tokenModal, { width: '80vw' });
  }

  rerenderMap() {
    this.showMap = false;  //todo rewrite spike
    setTimeout(() => {
      this.showMap = true;
    }, 10);
  }

  updateToken(token?: string) {
    this.tokenDialogRef.close();
    if (!token) return;
    this.mapboxService.Public_TOKEN = token;
    this.Public_TOKEN$.next(token);
    this.rerenderMap();
  }
}
