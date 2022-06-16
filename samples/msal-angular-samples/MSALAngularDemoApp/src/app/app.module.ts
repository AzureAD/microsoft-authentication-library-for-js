import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {HomeComponent} from './home/home.component'
import {ProductComponent} from './product/product.component'
import {ErrorComponent} from './error.component'
import {ProductDetailComponent} from './product/product-detail.component'
import {ProductService} from './product/product.service';
import {appRoutes} from './app.routes';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {MsalModule} from "@azure/msal-angular";
import { MsalInterceptor} from "@azure/msal-angular";
import { TodoListComponent } from './todo-list/todo-list.component';
import {TodoListService} from "./todo-list/todo-list.service";
import {UserDataComponent} from "./user-data/user-data.component";
import { HttpServiceHelper } from './common/HttpServiceHelper';

export function loggerCallback(logLevel, message, piiEnabled) {
  console.log("client logging" + message);
}


export const protectedResourceMap:[string, string[]][]=[ ['https://buildtodoservice.azurewebsites.net/api/todolist',['api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user']] , ['https://graph.microsoft.com/v1.0/me', ['user.read']] ];

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

@NgModule({
  declarations: [
    AppComponent, HomeComponent, ProductComponent, ErrorComponent, ProductDetailComponent, TodoListComponent, UserDataComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    RouterModule.forRoot(appRoutes,{useHash:true}) ,
    MsalModule.forRoot({
        clientID: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
        authority: "https://login.microsoftonline.com/common/",
        validateAuthority: true,
        redirectUri: "http://localhost:4200/",
        cacheLocation : "localStorage",
        storeAuthStateInCookie: isIE, // set to true for IE 11
        postLogoutRedirectUri: "http://localhost:4200/",
        navigateToLoginRequestUrl: true,
        popUp: !isIE,
        consentScopes: [ "user.read", "openid", "profile", "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"],
        unprotectedResources: ["https://www.microsoft.com/en-us/"],
        protectedResourceMap: protectedResourceMap,
        logger: loggerCallback,
        correlationId: '1234',
        piiLoggingEnabled: true
      }
    ),
  ],
  providers: [ProductService, TodoListService, HttpServiceHelper,
     {provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
