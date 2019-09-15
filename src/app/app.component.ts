import { Component, Input } from '@angular/core';
import { HostListener } from "@angular/core";
import MessageService from './service/message';

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

  @Input() public selectedMoment = null;

  constructor(private messageService: MessageService) { }

  onChange(changes) {
    this.messageService.sendMessage(this.selectedMoment);
  }

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }
}

