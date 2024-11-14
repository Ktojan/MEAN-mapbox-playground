
import { Injectable } from '@angular/core';
import { environment } from '../../../env';

@Injectable({ providedIn: 'root' }) export class MapboxService {
    constructor() { }
    private _Public_TOKEN = environment.public_token.slice();
    public get Public_TOKEN() { return this._Public_TOKEN }
    public set Public_TOKEN(token) { this._Public_TOKEN = token; }
}

export const Default3DbuildingsConfig = {
    'fill-extrusion-color': '#F2ECE2',
    'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'height']
    ],
    'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'min_height']
    ],
    'fill-extrusion-opacity': 0.8
}

