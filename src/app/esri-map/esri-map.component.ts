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

let EsriMapView, GraphicsLayer, WebMap, Graphic, Track, Search, Legend, LayerList, RouteTask, FeatureSet, RouteParameters;

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
  public closeByLocations: esri.Graphic[] = [];

  public visible: boolean[] = [];
  public markingIndex = 2;

  public map: esri.WebMap = null;
  public mapView: esri.MapView = null;

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
        this.selectedTime$ = x.date;

        if (this.map && this.map.loaded && this.selectedTime$) {
          const timeAgoCrime = (new Date().getTime() - this.selectedTime$.getTime()) / (1000 * 3600 * 24);
          
          (this.map.layers.getItemAt(6) as esri.FeatureLayer).definitionExpression = `Cycle_Time_in_Days >= ${timeAgoCrime}`;
          (this.map.layers.getItemAt(4) as esri.FeatureLayer).definitionExpression = `Cycle_Time_in_Days >= ${timeAgoCrime}`;

        } else if (this.map && this.map.loaded) {
          (this.map.layers.getItemAt(6) as esri.FeatureLayer).definitionExpression = "";
          (this.map.layers.getItemAt(4) as esri.FeatureLayer).definitionExpression = "";
        }
      }
    });
  }

  async initializeMap() {
    // Load the modules for the ArcGIS API for JavaScript
    [
      EsriMapView,
      GraphicsLayer,
      WebMap,
      Graphic,
      Track,
      Search,
      Legend,
      LayerList,
      RouteTask,
      FeatureSet,
      RouteParameters
    ] = await loadModules([
      'esri/views/MapView',
      'esri/layers/GraphicsLayer',
      'esri/WebMap',
      'esri/Graphic',
      'esri/widgets/Track',
      'esri/widgets/Search',
      'esri/widgets/Legend',
      'esri/widgets/LayerList',
      'esri/tasks/RouteTask',
      'esri/tasks/support/FeatureSet',
      'esri/tasks/support/RouteParameters',
    ]);


    // Configure the Map
    this.map = new WebMap({
      basemap: 'streets-navigation-vector',
      portalItem: {
        id: 'ab221e479b264d1aa5cbda9e109d2af6'
      }
    });

    const graphicsLayer: esri.GraphicsLayer = new GraphicsLayer();
    this.map.add(graphicsLayer);

    // Initialize the MapView
    const mapViewProperties: esri.MapViewProperties = {
      container: this.mapViewEl.nativeElement,
      center: this._center,
      zoom: this._zoom,
      map: this.map
    };

    this.mapView = new EsriMapView(mapViewProperties);

    const track = new Track({
      view: this.mapView,
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

    this.mapView.ui.add(track, 'top-left');

    while (!this.map.loaded) {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 50);
      });
    }

    let legend: esri.Legend = new Legend({
      view: this.mapView,
      layerInfos: [{
        layer: this.map.layers.getItemAt(0),
        title: 'Legend'
      }]
    });

    this.mapView.ui.add(legend, 'bottom-right');

    for (let i = 0; i < this.map.layers.length; i++) {
      this.visible.push(true);
    }
    this.map.layers.getItemAt(0).listMode = "hide";

    this.mapView.on("key-up", (event) => {
      if (event.native.keyCode >= 48 && event.native.keyCode <= 57) {
        const number = event.native.keyCode - 48;

        if (!event.native.shiftKey) {
          this.visible[number] = !this.visible[number];
        }

        if (number < this.map.layers.length) {
          if (!event.native.shiftKey) {
            this.map.layers.getItemAt(number).visible = this.visible[number];
          }

          if (this.visible[number]) {
            this.markingIndex = number;
            this.findNearbyCrimes();
          }

          this.mapView.ui.remove(legend);
          legend = new Legend({
            view: this.mapView,
            layerInfos: [{
              layer: this.map.layers.getItemAt(number),
              title: this.map.layers.getItemAt(number).title
            }]
          });
          this.mapView.ui.add(legend, "bottom-right");

        }
      }
    });

    const search = new Search({
      view: this.mapView
    });

    this.mapView.ui.add(search, 'top-right');

    const layerList = new LayerList({
      view: this.mapView
    });

    this.mapView.ui.add(layerList, 'bottom-left');

    this.mapView.on('double-click', (evt) => {
      this.mapView.graphics.removeAll();
      this.crimeLocation = evt.mapPoint;

      const point = {
        type: 'point', // autocasts as /Point
        x: evt.mapPoint.x,
        y: evt.mapPoint.y,
        spatialReference: this.mapView.spatialReference
      };

      const crimeGraphic: esri.Graphic = new Graphic({
        geometry: point,
        symbol: {
          type: 'simple-marker', // autocasts as SimpleMarkerSymbol
          style: 'square',
          color: 'red',
          size: '16px',
          outline: { // autocasts as SimpleLineSymbol
            color: [255, 255, 0],
            width: 3
          }
        }
      });
      this.mapView.graphics.add(crimeGraphic);

      this.findNearbyCrimes().then((nearbyPointsGraphics: esri.Graphic[]) => {
        nearbyPointsGraphics.forEach((pointGraphic: esri.Graphic) => {  
          const POIGraphic: esri.Graphic = new Graphic({
            geometry: pointGraphic.geometry,
            symbol: {
              type: 'simple-marker', // autocasts as SimpleMarkerSymbol
              color: 'purple',
              size: '16px',
              outline: { // autocasts as SimpleLineSymbol
                color: [255, 255, 0],
                width: 3
              }
            }
          });
          if (this.map.layers.getItemAt(this.markingIndex).visible) {
            this.mapView.graphics.add(POIGraphic);
          }
        })

      });

      //   this.closeByLocations.forEach((pnt) => {
      //     console.log('hihihi');
      //     console.log(pnt);
      //     // this.crimeLocation = evt.mapPoint;
      //     const POIPoint = {
      //       type: 'point', // autocasts as /Point
      //       // x: pnt.geometry.x,
      //       // y: pnt.geometry.y,
      //       x: 525765,
      //       y: 181629,
      //       spatialReference: this.mapView.spatialReference
      //     };

      //     const POIGraphic = new Graphic({
      //       geometry: POIPoint,
      //       symbol: {
      //         type: 'simple-marker', // autocasts as SimpleMarkerSymbol
      //         style: 'square',
      //         color: 'red',
      //         size: '16px',
      //         outline: { // autocasts as SimpleLineSymbol
      //           color: [255, 255, 0],
      //           width: 3
      //         }
      //       }
      //     });
      //     this.mapView.graphics.add(POIGraphic);
      // });
    });

    // this.mapView.on('click', (event) => {
    //   console.log('click');
    // });

    return this.mapView;
  }

  async findNearbyCrimes(): Promise<esri.Graphic[]> {
    this.closeByLocations = [];
    const layer: esri.FeatureLayer = this.map.layers.getItemAt(this.markingIndex) as esri.FeatureLayer;

    const query = layer.createQuery();
    query.geometry = this.crimeLocation;
    query.distance = 500;
    query.units = 'meters';

    return new Promise((resolve, reject) => {
      layer.queryFeatures(query)
        .then((response: esri.FeatureSet) => {
          this.closeByLocations = response.features;
          resolve(this.closeByLocations);
        });

    });
  }

  // Finalize a few things once the MapView has been loaded
  houseKeeping(mapView) {
    mapView.when(() => {
      console.log('mapView ready: ', mapView.ready);
      this._loaded = mapView.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  onKey(event) {
    console.log(event);
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
