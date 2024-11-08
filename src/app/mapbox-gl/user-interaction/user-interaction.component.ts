// ---------------------------ANGULAR CORE ----------------- //
import { KeyValuePipe, NgForOf, UpperCasePipe, NgIf } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
// ---------------------------ANGULAR MATERIAL ----------------- //
import { MatAccordion, MatExpansionModule} from '@angular/material/expansion';
import { MatButtonToggleModule} from '@angular/material/button-toggle';
import { MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatButtonModule} from '@angular/material/button';
import { MatRadioModule} from '@angular/material/radio';
import { MatChipsModule} from '@angular/material/chips';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatIconModule} from '@angular/material/icon';
import { MatSelectModule} from '@angular/material/select';
import { MatTable, MatTableModule} from '@angular/material/table';
import { MatDialog, MatDialogModule,  MatDialogActions,  MatDialogClose,  MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
// --------------------------- MAPBOX stuff and files ----------------- //
import { MapboxService, ProjectionLabels } from '../mapbox.service';
import { BASIC_DRAW_CONFIG, COLOR_SHADES } from '../../utils';
import { IMapboxDraw, IMapboxLocation, IMapboxMarker } from '../../interfaces';
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { IControl, Map } from 'mapbox-gl';

@Component({
  selector: 'app-user-interaction',
  standalone: true,
  imports: [NgForOf, NgIf, FormsModule, ReactiveFormsModule, MatAccordion, MatExpansionModule, MatButtonModule, 
    MatButtonToggleModule, MatSlideToggleModule, MatRadioModule, UpperCasePipe, KeyValuePipe, MatChipsModule,
    MatFormFieldModule, MatIconModule, MatSelectModule, MatTable, MatTableModule,
    MatDialogModule,  MatDialogActions,  MatDialogClose,  MatDialogContent, MatDialogTitle],
  templateUrl: './user-interaction.component.html',
  styleUrl: './user-interaction.component.scss'
})
export class UserInteractionComponent {
  @Input('config') config: any;
  @Input('map') map: Map;  
  @Input('locations') locations:  IMapboxLocation[];
  @Input('isFloating') isFloating: boolean = false;
  @Input('customMarkers') customMarkers: IMapboxMarker[];
  @Output() changeMapLocation = new EventEmitter();
  @Output() toggleLayer = new EventEmitter();
  @Output() toggleFloating = new EventEmitter();
  @Output() toggleOnlyLocationMarkers = new EventEmitter();
  @Output() changeMapTilesStyle = new EventEmitter();
  @Output() updateMarkers = new EventEmitter();
  @Output() exportMarkersToFile = new EventEmitter();
  @Output() exportDrawToFile = new EventEmitter();
  @Output() centerToEntity = new EventEmitter();
  @Output() changeProjection = new EventEmitter();

  @ViewChild('saveDrawnModal') saveDrawnModal: TemplateRef<any> | undefined;
  @ViewChild(MatTable) table: MatTable<any>;
  displayedColumns: string[] = ['name', 'comment', 'export', 'remove'];
  readonly dialog = inject(MatDialog);
  savedDraws = [];
  mapboxService = inject(MapboxService);
  projections = this.mapboxService.projectionsDefault;
  projectionLabels = ProjectionLabels;
  readonly formControl = new FormControl([]);
  layerId = 'streets';
  colorShades = COLOR_SHADES;
  step = signal(null); //accordion  toggler
  draw: MapboxDraw;
  newDraw: IMapboxDraw = { name: '', coords: [], location: '', comment: 'Created: ' + new Date().toDateString(), featureCollection: { type: "FeatureCollection", features: []}};
  drawControl: IControl = {};

  ngOnInit() {
    this.loadProjections();
    this.loadDraws();
  }

  loadDraws(withToggle?: boolean) {
    this.mapboxService.getDrawsForLocation(this.config.currentLocation.name).subscribe(
      draws => {
        this.savedDraws = [...draws];
        if (withToggle) this.toggleDraw();
      }
    );
  }

  loadProjections() {
    this.mapboxService.getProjections().subscribe(prs => {
       if (prs.length > 0) this.projections = prs
     });
  }

  changeMapLocationHandle(name: string) {    
    this.changeMapLocation.emit(name);
    this.loadDraws(true);
  }
  //--------------  MARKERS HANDLERS --------------- //
  
  addMarker(event): void {
    const value = (event.value || '').trim();
    if (!value) return;
    event.chipInput!.clear();
    const addedMarker: IMapboxMarker = { 
      name: value,
      coords: this.config.currentViewCenter || this.config.currentLocation.coords,
      location: this.config.currentLocation['name'] || '' 
    };
    this.customMarkers.push(addedMarker);
    this.updateMarkers.emit({ marker: addedMarker });
  }

  removeMarker(name: string) {
    const removedMarker = this.customMarkers.find(marker => marker.name === name);
    if (removedMarker) this.updateMarkers.emit({ marker: removedMarker, isDeleting: true });
    this.customMarkers = this.customMarkers.filter(marker => marker.name !== name)
  }

  //--------------  DRAW HANDLERS --------------- //

  toggleDraw() {
    if (this.draw) {
      this.map.on('draw.create', () => {});
      this.map.removeControl(this.draw); 
      this.draw = null;
    }  
    if (this.config.isDrawActive) {
      this.draw = new MapboxDraw({ ...BASIC_DRAW_CONFIG });
      this.map.addControl(this.draw);
      if (this.savedDraws && this.savedDraws.length > 0) { // load existing features to new map instance
        this.getAllFeatures().features.forEach((collection) => {
          this.draw.add(collection);
       } );
      }
    }
  }

  getAllFeatures() {
    return this.savedDraws.reduce((acc, cur) => {
      if (cur.featureCollection.features) acc.features = acc.features.concat(cur.featureCollection.features)
      else acc.features.push(cur.featureCollection[0]);
      return acc
    }, {type: "FeatureCollection", features: []});
  }

  initNewDraw() {
    if (!confirm('All unsaved changed will be removed, unless saved')) return;
    this.loadDraws(true);
  }

  removeDraw(name: string) {
    this.savedDraws = this.savedDraws.filter(draw => draw.name !== name);
    this.table.renderRows();
    this.mapboxService.removeDraw(name).subscribe(_ => this.toggleDraw());
  }

  addDraw() {
    this.mapboxService.addDraw(this.newDraw).subscribe(res => {
      this.savedDraws.push({ ...this.newDraw});
      this.table.renderRows();
      this.newDraw.name = '';
      this.newDraw.comment = 'Created: ' + new Date().toDateString();
      this.newDraw.coords = [];
    })    
  }

  saveDraw() {
    const currentColl = this.draw.getAll().features?.slice(this.savedDraws.length); 
    this.newDraw = { ...this.newDraw,
      location: this.config.currentLocation.name,
      coords: currentColl[0].geometry?.coordinates[0][0] || [],
      featureCollection: { features: [...currentColl], type: "FeatureCollection" }
    }
    console.log('saving new draw: ', this.newDraw);
    const dialogRef = this.dialog.open(this.saveDrawnModal);
    dialogRef.afterClosed().subscribe(isSaved => {
      if (isSaved) this.addDraw();
    });
  }

  setStep(index: number) {
    this.step.set(index);
  }
}
