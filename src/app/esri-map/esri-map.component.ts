/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss']
})
export class EsriMapComponent implements OnInit {

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewNode', {static: true}) private mapViewEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 10;
  private _center: Array<number> = [0.1278, 51.5074];
  private _basemap = 'streets';
  private _loaded = false;


  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() { }

  async initializeMap() {
    try {

      // Load the modules for the ArcGIS API for JavaScript
      const [EsriMap, EsriMapView, GraphicsLayer, Sketch, WebMap, Locate, Graphic, Track, Search] = await loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/GraphicsLayer',
        'esri/widgets/Sketch',
        'esri/WebMap',
        'esri/widgets/Locate',
        'esri/Graphic',
        'esri/widgets/Track',
        'esri/widgets/Search'
      ]);

      const graphicsLayer: esri.GraphicsLayer = new GraphicsLayer();

      // Configure the Map
      const map = new WebMap({
        // layers: [graphicsLayer],
        basemap: 'streets-navigation-vector',
        portalItem: {
          id: 'ab221e479b264d1aa5cbda9e109d2af6'
        }
      });

      // Initialize the MapView
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };

      const mapView = new EsriMapView(mapViewProperties);

      // const sketch = new Sketch({
      //   view: mapViewProperties,
      //   layer: graphicsLayer
      // });

      // mapView.ui.add(sketch, 'top-right');

      const track = new Track({
        view: mapView,
        graphic: new Graphic({
          symbol: {
            type: 'simple-marker',
            size: '12px',
            color: 'green',
            outline: {
              color: '#efefef',
              width: '1.5px'
            }
          }
        }),
        useHeadingEnabled: false  // Don't change orientation of the map
      });

      mapView.ui.add(track, 'top-left');

      const search = new Search({
        view: mapView
      });

      mapView.ui.add(search, 'top-right');

      mapView.on('click', (evt)  => {
        search.clear();
        mapView.popup.clear();
        if (search.activeSource) {
          const geocoder = search.activeSource.locator; // World geocode service
          const params = {
            location: evt.mapPoint
          };
          geocoder.locationToAddress(params)
            .then((response) => { // Show the address found
              const address = response.address;
              showPopup(address, evt.mapPoint);
            }, (err) => { // Show no address found
              showPopup('No address found.', evt.mapPoint);
            });
        }
      });

      function showPopup(address, pt) {
        mapView.popup.open({
          title:  + Math.round(pt.longitude * 100000) / 100000 + ',' + Math.round(pt.latitude * 100000) / 100000,
          content: address,
          location: pt
        });
      }

      return mapView;

    } catch (error) {
      console.log('EsriLoader: ', error);
    }

  }

  // Finalize a few things once the MapView has been loaded
  houseKeeping(mapView) {
    mapView.when(() => {
      console.log('mapView ready: ', mapView.ready);
      this._loaded = mapView.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then((mapView) => {
      this.houseKeeping(mapView);
    });
  }

}
