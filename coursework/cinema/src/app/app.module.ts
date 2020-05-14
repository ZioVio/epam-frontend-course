import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS }   from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { MainComponent } from './components/pages/main/main.component';
import { CarouselComponent } from './components/carousel/carousel.component';


import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoadingDirective } from './directives/loading.directive';
import { SharedModule } from './shared/shared.module';
import { FooterComponent } from './components/layout/footer/footer.component';

import { HTPPInterseptorService } from './services/htppinterseptor.service';
import { BaseService } from './services/base.service';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    MainComponent,
    CarouselComponent,
    LoadingDirective,
    FooterComponent,
  ],
  entryComponents: [],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    SharedModule
  ],
  providers: [
    BaseService,
    { provide: HTTP_INTERCEPTORS, useClass: HTPPInterseptorService, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
