import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { EsriMapComponent } from './esri-map/esri-map.component';

import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    EsriMapComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    OwlDateTimeModule, 
    OwlNativeDateTimeModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
