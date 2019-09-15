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

import MessageService from '../service/message';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss']
})
export class EsriMapComponent implements OnInit {

  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;

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

  public crimeLocation: esri.Point;

  public map: esri.WebMap = null;

  public selectedTime$: Date;
  private subscriptionTime: Subscription;

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

  constructor(private messageService: MessageService) {
    this.subscriptionTime = this.messageService.getMessage().subscribe({
      next: (x) => {
        console.log(`updated time to ${JSON.stringify(x)}`);
        this.selectedTime$ = x.date;
        if (this.map && this.map.loaded && this.selectedTime$) {
          const featureLayer = this.map.findLayerById("csv_7704") as esri.FeatureLayer;
          const timeAgoCrime = (new Date().getTime() - this.selectedTime$.getTime()) / (1000 * 3600 * 24);
          console.log(timeAgoCrime);
          console.log(this.map.allLayers);
          console.log(featureLayer.fields);
          featureLayer.definitionExpression = `Cycle_Time_in_Days >= ${timeAgoCrime}`;
        } else if (this.map && this.map.loaded) {
          const featureLayer = this.map.findLayerById("csv_7704") as esri.FeatureLayer;
          featureLayer.definitionExpression = "";
        }
      }
    });
  }

  async initializeMap() {
    // Load the modules for the ArcGIS API for JavaScript
    const [EsriMapView, GraphicsLayer, WebMap, Graphic, Track, Search, Legend, FeatureLayer] = await loadModules([
      'esri/views/MapView',
      'esri/layers/GraphicsLayer',
      'esri/WebMap',
      'esri/Graphic',
      'esri/widgets/Track',
      'esri/widgets/Search',
      'esri/widgets/Legend',
      'esri/layers/FeatureLayer',
    ]);

    const graphicsLayer: esri.GraphicsLayer = new GraphicsLayer();

    // Configure the Map
    this.map = new WebMap({
      // layers: [graphicsLayer],
      basemap: 'streets-navigation-vector',
      portalItem: {
        id: 'ab221e479b264d1aa5cbda9e109d2af6'
      }
    });

    this.map.add(graphicsLayer);

    // Initialize the MapView
    const mapViewProperties: esri.MapViewProperties = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: this.map
    };

    const mapView: esri.MapView = new EsriMapView(mapViewProperties);

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

    while (!this.map.loaded) {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 50);
      });
    }

    let legend = new Legend({
      view: mapView,
      layerInfos: [{
        layer: this.map.findLayerById("csv_7704"),
        title: "Legend"
      }]
    });

    mapView.ui.add(legend, "bottom-right");

    const search = new Search({
      view: mapView
    });

    mapView.ui.add(search, 'top-right');

    mapView.on('double-click', (evt) => {
      this.crimeLocation = evt.mapPoint;

      mapView.graphics.removeAll();

      let point = {
        type: "point", // autocasts as /Point
        x: evt.mapPoint.x,
        y: evt.mapPoint.y,
        spatialReference: mapView.spatialReference
      };
    
      let graphic = new Graphic({
        geometry: point,
        symbol: {
          type: "simple-marker", // autocasts as SimpleMarkerSymbol
          style: "square",
          color: "red",
          size: "16px",
          outline: { // autocasts as SimpleLineSymbol
            color: [255, 255, 0],
            width: 3
          }
        }
      });
      mapView.graphics.add(graphic);
    
    });

    mapView.on('click', (event) => {
      console.log('click');
    });

    return mapView;
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

  ngOnDestroy() {
    // unsubscribe to ensure no memory leaks
    this.subscriptionTime.unsubscribe();
  }
}
