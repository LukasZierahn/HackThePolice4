import { Component } from '@angular/core';
import { HostListener } from "@angular/core";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent {
  // Set our map properties
  mapCenter = [-122.4194, 37.7749];
  basemapType = 'satellite';
  mapZoomLevel = 12;

  public currentDate = new Date();
  public selectedMoment = null;

  @HostListener("click") onClick(){
    console.log(this.selectedMoment);
  }

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }
}

