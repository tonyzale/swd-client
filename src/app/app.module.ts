import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent, CardComponent, ModalComponent, SocketService, ModalService } from './app.component';

@NgModule({
    declarations: [
        AppComponent,
        CardComponent,
        ModalComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [SocketService, ModalService],
    bootstrap: [AppComponent]
})
export class AppModule { }
