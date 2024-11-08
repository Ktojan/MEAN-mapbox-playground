// --------------------------- ANGULAR  ----------------- //
import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule} from '@angular/material/button';
import { MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatMenuModule} from '@angular/material/menu';
import { MatIconModule} from '@angular/material/icon';
import { MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import { UserInteractionComponent } from './user-interaction/user-interaction.component';
import { CommonMapStyles, MapboxService } from './mapbox.service';
import { BehaviorSubject } from 'rxjs';
// --------------------------- MAPBOX stuff and files ----------------- //
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';
import { LngLat, Map, MapLayerMouseEvent, Position, Marker, GeoJsonProperties } from 'mapbox-gl';
import tabuk_area_lines from '../../../public/assets/tabuk_area_lines.json';
import tabuk_area_polygons from '../../../public/assets/tabuk_area_polygons.json';
import san_franc_contour from '../../../public/assets/san-francisco.geo.json';
import NDVIs from '../../../public/assets/ndvi_polygons.json';
import { COLOR_SHADES, DefaultDrawFillColor, DefaultDrawOpacity, exportToJSON } from '../utils';
import { BlankGeojson, Default3DbuildingsConfig, IMapboxDraw, IMapboxGeojson, IMapboxLocation, IMapboxMarker } from '../interfaces';

@Component({
  selector: 'app-mapbox-gl',
  standalone: true,
  imports: [UserInteractionComponent, NgxMapboxGLModule, NgForOf, NgIf, FormsModule, MatDialogModule,
  MatButtonModule, MatSlideToggleModule, MatMenuModule, MatIconModule, AsyncPipe],
  templateUrl: './mapbox-gl.component.html',
  styleUrl: './mapbox-gl.component.scss'
})
export class MapboxGlComponent {
  @ViewChild('tokenModal') tokenModal: TemplateRef<HTMLElement>;

  dialog = inject(MatDialog);
  tokenDialogRef: MatDialogRef<any>;
  mapboxService = inject(MapboxService);
  Public_TOKEN$ = new BehaviorSubject(this.mapboxService.Public_TOKEN);

  map: Map;
  showMap = true;
  streetsMapStyle = CommonMapStyles.streets9.slice();
  locations: IMapboxLocation[] = []; //this.mapboxService.locations;
  startLocation: IMapboxLocation = this.mapboxService.getLocation('manhattan');
  zoomLevels = this.mapboxService.zoomLevels;
  customMarkers: IMapboxMarker[] = [];
  config = {
    mapStyle: this.streetsMapStyle,
    projection: this.mapboxService.projectionsDefault[0],
    currentLocation: this.startLocation,
    currentViewCenter: this.startLocation.coords,
    currentZoom: this.startLocation.initialZoom ,
    pitch: this.startLocation.initialZoom >= 15 ? 45 : 0,
    bearing: 0,
    toggledLayers: ['polygons', 'lines'],
    cursorStyle: 'grab',
    show3D: true,
    isDrawActive: false,
    drawColor: DefaultDrawFillColor,
    drawOpacity: DefaultDrawOpacity,
    onlyLocationMarkers: true,
    minZoom3D: 15,
    layouts: {
      polygons: {
        visibility: 'visible',
      },
      lines: {
        visibility: 'visible',
      },
      quakes: {
        visibility: 'visible',
      },
    },
    paints: {
      fill: {
        'fill-color': COLOR_SHADES.orange[0],
        'fill-opacity': 0.5
      },
      line: {
        'line-color': COLOR_SHADES.green[0],
        'line-width': 6
      },
      d3buildings: Default3DbuildingsConfig
    },
  }
  tabuk_area_polygons: IMapboxGeojson = BlankGeojson;
  san_franc_cal_contour: IMapboxGeojson = BlankGeojson;
  tabuk_area_lines = tabuk_area_lines;
  tabuk_geometries = [];
  earthquakes: any;
  clusterLayers: any;
  selectedElementPopup = '';
  selectedLngLat: LngLat;
  isFloating = false;
  floatingInt = null;
  colorShades = COLOR_SHADES;
  errorMessage = '';


  ngOnInit() {
    this.loadInitialStuff();
  }
  
  loadInitialStuff() {
    this.loadPolygons();
    this.reloadMarkers();
    this.mapboxService.getLocations().subscribe({
      next: (locations) => { this.locations = locations },
      error: (hardcodedLocations) => { 
        this.locations = hardcodedLocations
       }
    });
  }

  mapCreation(mapInstance: Map) {
    this.map = mapInstance;
    console.log('Mapbox-gl map created: ', mapInstance);
    this.map.on('dragend', () => {
      const center = mapInstance.getCenter()
      this.config.currentViewCenter = [center['lng'], center['lat']];
    });
  }

  loadPolygons() {
    const unitedFeatures = this.tabuk_area_polygons.data['features'].concat(NDVIs);
    this.tabuk_area_polygons = { ...tabuk_area_polygons, type: 'geojson', data: {
      type: 'FeatureCollection',
      features: unitedFeatures
    }};
    this.san_franc_cal_contour = { ...san_franc_contour as IMapboxGeojson };
    if (this.config.currentLocation?.layers && this.config.currentLocation.layers.includes('quakes'))
      this.getEarthQuakesData();
  }


  layerClick(event: MapLayerMouseEvent) {
    const props = event.features?.[0].properties as GeoJsonProperties;
    if (!props || !event.lngLat) return;
    this.selectedElementPopup = props.name ? `<b>${props.name}</b><br><br>` : '';
    this.selectedLngLat = event.lngLat;
    Object.entries(props).forEach(el => this.selectedElementPopup += `${el[0]}: ${el[1]}<br>`);
  }

// --------------- mgl-map event handlers --------------- //

  onLoad(mapInstance: Map) {
    const layers = mapInstance.getStyle().layers;
    if (!layers) return;
  }
  onZoomEnd(mapInstance: Map) {
    this.config.currentZoom = mapInstance.getZoom().toFixed(1);
  }
  setZoomLevel(level) { 
    if (level.zoom >= 15) this.config.pitch = 45;
    this.config.currentZoom = level.zoom;
  }  
  onGeolocate(position: Position) {
    console.log('My current geo location: ', position);
  }

// --------------- HANDLERS FOR EMITTED EVENTS FROM app-user-interaction --------------- //

  changeMapLocation(name: string) {
      const newlocation: IMapboxLocation = this.locations.find(l => l.name === name);
      if (!newlocation) return;
      this.config.currentLocation = newlocation;
      this.config.currentViewCenter = newlocation.coords;
      this.config.currentZoom = newlocation.initialZoom;
      this.reloadMarkers();
      if (newlocation.layers && newlocation.layers?.includes('quakes')) this.getEarthQuakesData();
    }

  toggleLayer(event: { value: string }) {
    this.config.layouts[event.value] = {
      ...this.config.layouts[event.value],
      visibility:
      this.config.layouts[event.value].visibility === 'visible' ? 'none' : 'visible',
    };
  }

  toggleFloating(): void { // "Let's fly" button handler
    const initialPitch = this.config.pitch, initialBearing = this.config.bearing;
    if (!this.isFloating) {
      let angle = 0;
    this.floatingInt = setInterval(() => {
      angle += 0.01;
      if (angle === 1) {
        angle = 0;
      }
      this.config.pitch = 50 + 15 * Math.cos(angle);
      this.config.bearing = -20 + 20 * Math.sin(angle);
    }, 20);    
    } else {
      clearInterval(this.floatingInt);
      this.config.pitch = initialPitch;
      this.config.bearing = initialBearing;
    }
    this.isFloating = !this.isFloating;
  }
  

  toggleOnlyLocationMarkers() {
    this.reloadMarkers(!this.config.onlyLocationMarkers);
  }

  changeMapTilesStyle(layerId: string) {
    if (layerId) this.config.mapStyle = `mapbox://styles/mapbox/${layerId}-v9`; //todo
  }  

  reloadMarkers(omitlocation?: boolean | undefined) {
    this.mapboxService.getAllMarkers(omitlocation ? '' : this.config.currentLocation.name)
      .subscribe(markers => this.customMarkers = markers);
  }

  addOrRemoveMarkers({ marker, isDeleting }) {
    isDeleting ? 
      this.mapboxService.removeMarker(marker).subscribe(_ => this.reloadMarkers())
    : this.mapboxService.addMarker(marker).subscribe(createdMarker => {
      marker.id = createdMarker.id;
      this.reloadMarkers();
  });
  }

  onDragEnd(marker: Marker, customMarker: IMapboxMarker) {
    const newCoords = marker.getLngLat().toArray();
    if (customMarker.coords[0] === newCoords[0] && customMarker.coords[1] === newCoords[1]) return;
    customMarker.coords = newCoords;
    this.mapboxService.updateMarker(customMarker).subscribe();
  }

  exportMarkersToFile() {
    const filteredMarkers = this.config.onlyLocationMarkers ?
      this.customMarkers.filter(m => m.location === this.config.currentLocation.name)
      : this.customMarkers;
    console.log('Json Data to export: ', filteredMarkers);
    const formattedMarkers = filteredMarkers.map(marker => ({
      "type": "Feature",
      "properties": {
        "name": marker.name,
        "location": marker.location
      },
      "geometry": { "type": "Point", "coordinates": marker.coords }
    }))
    const body = {
      "type": "FeatureCollection",
      "features": formattedMarkers
    };
    const fileName = (this.config.onlyLocationMarkers ? this.config.currentLocation.name : 'all').replace(/\s/, '') + "-markers.json";
    exportToJSON(body, fileName); 
  }

  exportDrawToFile(draw) {
    const fileName = draw.name.replace(/\s/, '') + '-' + this.config.currentLocation.name + ".json";
    exportToJSON(draw.featureCollection, fileName); 
  }

  changeProjection(event: Event) {
    const newProjection = (event.target as HTMLSelectElement).value;
    this.mapboxService.getProjectionByName(newProjection).subscribe(pr => {
      if (pr) this.config.projection = pr;
  });
  }

  centerMapTo(entity: any) {
    const newCenter = entity.coords;
    if (newCenter) {
      this.config.currentLocation.coords = newCenter;
      this.config.currentViewCenter = newCenter;
      if (this.config.currentZoom < 10) this.config.currentZoom = 13;
    }
  }

  mapErrorHandler(event) { //todo
    const errorObject = event.error.message;    
    const paramsIndex = errorObject.indexOf('?');
    this.errorMessage = errorObject.slice(0, paramsIndex);
    console.error(errorObject);
    if (errorObject.includes('access_token')) this.tokenDialogRef = this.dialog.open(this.tokenModal, { width: '80vw'});
  }

  updateToken(token?: string) { 
    this.tokenDialogRef.close();
    if (!token) return;
    this.mapboxService.Public_TOKEN = token;
    this.Public_TOKEN$.next(token);
    this.showMap = false;  //todo rewrite spike
    setTimeout(()=> this.showMap = true, 100);
  }

  async getEarthQuakesData() {
    this.earthquakes = (await import('../../../public/assets/earthquakes-CAL.geo.json'));
    const layersData: [number, string][] = [
      [0, 'yellow'],
      [3, 'orange'],
      [6, 'red'],
    ];
    this.clusterLayers = layersData.map((data, index) => ({
      type: 'circle',
      id: `cluster-${index}`,
      paint: {
        'circle-color': data[1],
        'circle-radius': 20,
        'circle-blur': 1,
      },
      filter:
        index === layersData.length - 1
          ? ['>=', 'point_count', data[0]]
          : ['all',  ['>=', 'point_count', data[0]], ['<', 'point_count', layersData[index + 1][0]]]
    }));
  }
}
