export interface IMapboxLocation {
    name: string,
    label: string,
    initialZoom: number,
    coords: number[],
    layers?: string[]

}
export interface IMapboxMarker {
    name: string,
    coords: number[],
    id?: number,
    location?: string,
}

export interface IMapboxDraw {
    name: string,
    location: string,
    featureCollection: IGeojsonData,
    comment?: string,
    coords?: [],
}

interface IGeojsonData {
    type: "FeatureCollection",
    features: any[]
}

export interface IMapboxGeojson {
    type: 'geojson',
    data: IGeojsonData
}

//------- CONSTANTS --------- //

export const BlankGeojson: IMapboxGeojson = {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
}

export const Default3DbuildingsConfig = {
    'fill-extrusion-color': '#999',
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
    'fill-extrusion-opacity': 0.7
}
