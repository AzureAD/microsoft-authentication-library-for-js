import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';

import { MatToolbarModule, MatButtonModule, MatListModule } from '@angular/material';

import { MsalModule, MsalInterceptor } from '@azure/msal-angular';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { ProfileComponent } from './profile/profile.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

export const protectedResourceMap: [string, string[]][] = [
  ['https://graph.microsoft.com/v1.0/me', ['user.read']]
];

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

@NgModule({
  declarations: [
    AppComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    RouterModule.forRoot(appRoutes, { useHash: false }),
    MsalModule.forRoot({
      auth: {
        clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        authority: "https://login.microsoftonline.com/common/",
        validateAuthority: true,
        redirectUri: "http://localhost:4200/",
        postLogoutRedirectUri: "http://localhost:4200/",
        navigateToLoginRequestUrl: true,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: isIE, // set to true for IE 11
      },
    },
      {
        popUp: !isIE,
        consentScopes: [
          "user.read",
          "openid",
          "profile",
          "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"
        ],
        unprotectedResources: ["https://www.microsoft.com/en-us/"],
        protectedResourceMap,
        extraQueryParameters: {}
      }
    )
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
