import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent} from './home.component'
import { ContactComponent} from './contact.component'
import { ProductComponent} from './product.component'
import { ErrorComponent} from './error.component'
import { ProductDetailComponent} from './product-detail.component'
import { ProductService } from './product.service';
import { appRoutes } from './app.routes';
import {MyProfileComponent} from "./myProfile.component";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { MsalModule , MsalInterceptor} from "../../../../dist";
import {Logger, LogLevel} from "../../../../../msal-core/lib-commonjs";

export function loggerCallback(logLevel, message, piiEnabled) {
  console.log("client logging" + message );
}

export const myLogger =new Logger(loggerCallback, {  correlationId: '12345', level: LogLevel.Verbose});
export const  endpointmap: Map<string, Array<string>> = new Map<string, Array<string>>();
endpointmap.set ("https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]);

@NgModule({
  declarations: [
    AppComponent, HomeComponent ,ContactComponent,ProductComponent,ErrorComponent,ProductDetailComponent, MyProfileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
   // RouterModule.forRoot(appRoutes, {useHash: true}),
    RouterModule.forRoot(appRoutes),
    MsalModule.forRoot({
      clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
      validateAuthority : true,
     // cacheLocation : "localStorage",
      postLogoutRedirectUri: "http://localhost:4200/",
      navigateToLoginRequestUrl : true,
      popUp: true,
      tokenReceivedCallback : null,
     scopes: ["user.read", "mail.send"],
     //anonymousEndpoints: ["https://graph.microsoft.com/v1.0/me"],
        endpoints : endpointmap,
       // logger :myLogger,
     //   extraQueryParameters : "prompt=none"
    }
    ),
  ],
  providers: [ProductService
    ,{ provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true }
    ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
