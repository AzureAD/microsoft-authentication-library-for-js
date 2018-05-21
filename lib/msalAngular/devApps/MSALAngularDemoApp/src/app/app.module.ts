import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {HomeComponent} from './home.component'
import {ProductComponent} from './product.component'
import {ErrorComponent} from './error.component'
import {ProductDetailComponent} from './product-detail.component'
import {ProductService} from './product.service';
import {appRoutes} from './app.routes';
import {MyProfileComponent} from "./myProfile.component";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {MsalModule, MsalInterceptor} from "../../../../dist";
import {LogLevel} from "../../../../../msal-core/lib-commonjs";

export function loggerCallback(logLevel, message, piiEnabled) {
  console.log("client logging" + message);
}

export const endpointmap: Map<string, Array<string>> = new Map<string, Array<string>>();
endpointmap.set("https://graph.microsoft.com/v1.0/me", ["user.read", "mail.send"]);

@NgModule({
  declarations: [
    AppComponent, HomeComponent, ProductComponent, ErrorComponent, ProductDetailComponent, MyProfileComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes),
    MsalModule.forRoot({
        clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        authority: "https://login.microsoftonline.com/microsoft.onmicrosoft.com/",
        validateAuthority: true,
        redirectUri: "http://localhost:4200/",
        cacheLocation : "localStorage",
        postLogoutRedirectUri: "http://localhost:4200/",
        navigateToLoginRequestUrl: true,
        popUp: false,
        scopes: ["user.read", "mail.send"],
        anonymousEndpoints: ["https:google.com"],
        endpoints: endpointmap,
        logger: loggerCallback,
        correlationId: '1234',
        level: LogLevel.Verbose,
        piiLoggingEnabled: true,

      }
    ),
  ],
  providers: [ProductService
    , {provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
