import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { MapboxGlComponent } from './mapbox-gl/mapbox-gl.component';
import { NgForOf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogContent } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgForOf, MapboxGlComponent, MatButtonModule, MatDialogModule, MatDialogContent, MatCardModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  @ViewChild('aboutModal') aboutModal: TemplateRef<HTMLElement>;
  dialog = inject(MatDialog);

  clickAbout(enterAnimationDuration: string, exitAnimationDuration: string) {
    this.dialog.open(this.aboutModal, { 
      width: '50vw',
      enterAnimationDuration,
      exitAnimationDuration,
     });
  }

}
