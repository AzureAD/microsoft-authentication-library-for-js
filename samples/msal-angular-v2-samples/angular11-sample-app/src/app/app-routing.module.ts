import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { MsalGuard } from '@azure/msal-angular';
import { DetailComponent } from './detail/detail.component';
import { FailedComponent } from './failed/failed.component';
import { LogoutComponent } from './logout/logout.component';
import { BrowserUtils } from '@azure/msal-browser';

const routes: Routes = [
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard]
  },
  {
    path: 'profile',
    canActivateChild: [MsalGuard],
    children: [
      {
        path: 'detail',
        component: DetailComponent
      }
    ]
  },
  { 
    path: 'lazyLoad', 
    loadChildren: () => import('./lazy/lazy.module').then(m => m.LazyModule),
    canLoad: [MsalGuard]
  },
  {
    // Needed for hash routing
    path: 'code',
    component: HomeComponent
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'login-failed',
    component: FailedComponent
  },
  {
      path: 'logout',
      component: LogoutComponent
  }
];

// Don't perform initial navigation in iframes or popups, except for logout
const initialNavigation = (!BrowserUtils.isInIframe() && !BrowserUtils.isInPopup()) || window.location.href.indexOf("logout") > 0; // Remove this line to use Angular Universal

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    // Don't perform initial navigation in iframes or popups, except for logout
    initialNavigation: initialNavigation ? 'enabled' : 'disabled' // Remove this line to use Angular Universal
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
