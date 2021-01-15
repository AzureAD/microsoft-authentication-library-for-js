# MSAL Angular 2.x Best Practices

Here are some of our optional but recommended practices when using MSAL Angular 2.x.

## Dedicated redirect component

MSAL Angular 2.x provides a dedicated redirect component that can be incorporated into your application. We recommend using this, as `msal.redirect.component.ts` is designed to handle all redirects for your application without your components needing to call `handleRedirectObservable()` manually. 

### Steps for adding the redirect component with hash routing
Hash routing is only compatible with using your home route as the `redirectUri`. If you are wanting to use a different page as your `redirectUri`, consider using path routing below.

1. Set your home page as the `redirectUri` in your app.module configuration, e.g. `http://localhost:4200`.
1. Make sure the `redirectUri` is saved in your application registration in the Azure Portal
1. Have hash routes in your `app-routing.module.ts`
1. You can use the `msal.redirect.component` as the component for the hash routes
1. Make sure that `useHash` is set to true in your `app-routing.module.ts`

- Do not need to call handleRedirectObservable in app (handleRedirectObservable is called and resolved in the auth component)

Your `app-routing.module.ts` may look something like this:
```js
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { MsalGuard } from '@azure/msal-angular';
import { MsalRedirectComponent } from './msal-redirect/msal.redirect.component';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [
      MsalGuard,
    ]
  },
  {
    // Needed for hash routing
    path: 'error',
    component: MsalRedirectComponent
  },
  {
    // Needed for hash routing
    path: 'state',
    component: MsalRedirectComponent
  },
  {
    // Needed for hash routing
    path: 'code',
    component: MsalRedirectComponent
  },
  {
    path: '',
    component: HomeComponent
  }
];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true, // Set tp true for hash routing
    initialNavigation: !isIframe ? 'enabled' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### Steps for adding the redirect component with path routing

If you do not want to use the home page as the `redirectUri`, you may consider using the redirect component with path routing. 

1. Set the `redirectUri` in your app.module configuration to your desired page, e.g. `http://localhost:4200/auth`
1. Make sure the `redirectUri` is saved in your application registration in the Azure Portal
1. Add the routing path to your `app-routing.module.ts` and use the `msal.redirect.component` as the component
1. Make sure that `useHash` is set to false in your `app-routing.module.ts`

- (Still needs to call handleRedirectObservable in Home component???)
- Weird webpack warning??
- (Can't type /auth in address bar???)

Your `app-routing.module.ts` may look something like this:
```js
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { MsalGuard } from '@azure/msal-angular';
import { MsalRedirectComponent } from './msal-redirect/msal.redirect.component';

const routes: Routes = [
  {
    // Dedicated component and path for redirects with path routing.
    path: 'auth',
    component: MsalRedirectComponent
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [
      MsalGuard,
    ]
  },
  {
    path: '',
    component: HomeComponent
  }
];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false, // Set to false for path routing
    initialNavigation: !isIframe ? 'enabled' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```
