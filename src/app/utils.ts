// ---------------------   INTERACTIVITY, HANDLERS todo feature versions  ----------------//

export const DefaultDrawFillColor = '#e665b0'
export const DefaultDrawOpacity = 0.55;

export const COLOR_SHADES = {
  // lightest first
  blue: [
    "#70eafa",
    "#62d3ec",
    "#57bddd",
    "#4ea7cc",
    "#4792bb",
    "#427ca8",
    "#3c6894",
    "#375480",
    "#30416b",
    "#292f56"
  ],
  // darkest first
  violet: [
    '#36175e',
    '#40216a',
    '#4a2b75',
    '#553581',
    '#5f3f8e',
    '#6a4a9a',
    '#7454a6',
    '#7f5fb3',
    '#8a6ac0',
    '#9575cd'
  ],
  green: ['#33691e', '#4f8338', '#6b9d52', '#86b76b', '#a2d185', '#beeb9f'],
  orange: ['#D23600', '#DF5600', '#ED7600', '#FA9600'],
}

export const BASIC_DRAW_CONFIG = {
  displayControlsDefault: false,
  controls: {
    polygon: true,
    line_string: true,
    trash: true
  },
  styles: [
    {
      "id": "gl-draw-line",
      "type": "line",
      "filter": ["all", ["==", "$type", "LineString"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": DefaultDrawFillColor,
        "line-dasharray": [0.2, 2],
        "line-width": 4
      }
    },
    // polygon fill
    {
      "id": "gl-draw-polygon-fill",
      "type": "fill",
      "filter": ["all", ["==", "$type", "Polygon"]],
      "paint": {
        "fill-color": DefaultDrawFillColor,
        "fill-outline-color": DefaultDrawFillColor,
        "fill-opacity": DefaultDrawOpacity
      }
    },
    // polygon mid points
    {
      'id': 'gl-draw-polygon-midpoint',
      'type': 'circle',
      'filter': ['all',
        ['==', '$type', 'Point'],
        ['==', 'meta', 'midpoint']],
      'paint': {
        'circle-radius': 5,
        'circle-color': '#777'
      }
    },
    // polygon outline stroke
    // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
    {
      "id": "gl-draw-polygon-stroke-active",
      "type": "line",
      "filter": ["all", ["==", "$type", "Polygon"]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": DefaultDrawFillColor,
        "line-dasharray": [0.2, 2],
        "line-width": 4
      }
    },
    // vertex point halos
    {
      "id": "gl-draw-polygon-and-line-vertex-halo-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      "paint": {
        "circle-radius": 5,
        "circle-color": "#FFF"
      }
    },
    // vertex points
    {
      "id": "gl-draw-polygon-and-line-vertex-active",
      "type": "circle",
      "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      "paint": {
        "circle-radius": 3,
        "circle-color": "#D20C0C",
      }
    }
  ]
}

export const LOCATIONS_DEFAULT = [
  { name: 'lisbon', label: 'Lisbon', initialZoom: 15, coords: [-9.13375953828801, 38.71596224520072] },
  { name: 'manhattan', label: 'New York', initialZoom: 15.5, coords: [-74.0066, 40.7135] },
  { name: 'sanjose', label: 'California', initialZoom: 6, coords: [-121.89934412154716, 37.3323119983157], layers: ['quakes', 'polygons'] },
]

export function exportToJSON(body, fileName) {
  let dataUri = "data:application/json;charset=utf-8," +
  encodeURIComponent(JSON.stringify(body));
  let linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", fileName);
  linkElement.click();  
}
