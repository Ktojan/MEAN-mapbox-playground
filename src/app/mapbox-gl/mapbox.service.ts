
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { IMapboxDraw, IMapboxLocation, IMapboxMarker } from '../interfaces';
import { LOCATIONS_DEFAULT } from '../utils';
import { environment } from '../../../env';

@Injectable({ providedIn: 'root' }) export class MapboxService {
    constructor(private http: HttpClient) { }

    private _Public_TOKEN = environment.public_token.slice();
    public get Public_TOKEN() { return this._Public_TOKEN }
    public set Public_TOKEN(token) { this._Public_TOKEN = token; }

    private _locationsHardcoded: IMapboxLocation[] = LOCATIONS_DEFAULT;
    
    public get locations() { return this._locationsHardcoded }

    private _zoomLevels = [
        { zoom: 15, scale: 'Buildings (with 3D)' },
        { zoom: 12, scale: 'District' },
        { zoom: 10, scale: 'Cities/towns' },
        { zoom: 6, scale: 'States' },
    ];
    public get zoomLevels() { return this._zoomLevels }

    private _projectionsDefault = [
        { name: 'mercator' },
        { name: 'equirectangular' }
    ]
    public get projectionsDefault() { return this._projectionsDefault }

    getLocation(location: string): IMapboxLocation {
        return this._locationsHardcoded.find(l => l.name === location) || this._locationsHardcoded[0];
    }

    // ----------------------  HTTP INTERACTIONS ------------------- //

    getLocations(): Observable<IMapboxLocation[]> {
        return this.http.get<IMapboxLocation[]>(environment.serverPort + 'api/mapbox-config/locations')
            .pipe(
                catchError(err => this.handleLocationsError(err))
            )
    }

    // -------------  PROJECTIONS HANDLERS ------------ //

    getProjections(): Observable<{ name: string }[]> {
        return this.http.get<{ name: string }[]>(environment.serverPort + 'api/mapbox-config/projections')
            .pipe(
                catchError(err => this.handleError(err))
            )
    }

    getProjectionByName(projectionName: string): Observable<{ name: string }> {
        return this.http.get<{ name: string }>(environment.serverPort + 'api/mapbox-config/projections', {
            params: { projectionName }
        }).pipe(
            catchError(err => this.handleError(err))
        )
    }

    // -------------  DRAWS HANDLERS ------------ //

    getDrawsForLocation(location: string): Observable<any[]> {
        return this.http.get<any[]>(environment.serverPort + 'api/draws', { params: { location }} )
            .pipe(
                catchError(err => this.handleError(err))
            )
    }

    addDraw(newDraw: IMapboxDraw): Observable<IMapboxDraw> {
        return this.http.post<IMapboxDraw>(environment.serverPort + 'api/draws', newDraw).pipe(
            catchError(er => this.handleError(er))
        )
    }

    removeDraw(name: string): Observable<IMapboxDraw> {
        return this.http.delete<IMapboxDraw>(environment.serverPort + 'api/draws/' + name).pipe(
            catchError(er => this.handleError(er))
        )
    }

    // -------------  MARKERS HANDLERS ------------ //

    getAllMarkers(location?: string): Observable<IMapboxMarker[]> {
        return this.http.get<IMapboxMarker[]>(environment.serverPort + 'api/markers',
            location ? {
                params: { location: location }
            } : {})
            .pipe(
                catchError(err => this.handleError(err))
            )
    }

    addMarker(newMarker: IMapboxMarker): Observable<IMapboxMarker> {
        return this.http.post<IMapboxMarker>(environment.serverPort + 'api/markers', newMarker).pipe(
            catchError(er => this.handleError(er))
        )
    }

    updateMarker(newMarker: IMapboxMarker): Observable<IMapboxMarker> {
        return this.http.put<IMapboxMarker>(environment.serverPort + 'api/markers/' + newMarker.id, newMarker).pipe(
            catchError(er => this.handleError(er))
        )
    }

    removeMarker(newMarker: IMapboxMarker): Observable<IMapboxMarker> {
        return this.http.delete<IMapboxMarker>(environment.serverPort + 'api/markers/' + newMarker.id).pipe(
            catchError(er => this.handleError(er))
        )
    }

    // -------------  END 0F ----  MARKERS HANDLERS ------------ //


    handleError(err: HttpErrorResponse): Observable<any> {
        console.error('Error from Server ', err);
        let dataError = new Error(err.statusText);
        return throwError(dataError);
    }

    handleLocationsError(err: HttpErrorResponse): Observable<IMapboxLocation[]> {
        console.error('Error from Server ', err);
        return of(this.locations);
    }

}

export enum ProjectionLabels {
    mercator = 'Mercator (basic)',
    equirectangular = 'Equirectangular',
    equalEarth = 'Equal Earth',
    naturalEarth = 'Natural Earth'
}

export enum CommonMapStyles {
    streets9 = 'mapbox://styles/mapbox/streets-v9',
    light10 = 'mapbox://styles/mapbox/light-v10',
}

