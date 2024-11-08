import { Component } from '@angular/core';
import { MapboxGlComponent } from './mapbox-gl/mapbox-gl.component';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgForOf, MapboxGlComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
