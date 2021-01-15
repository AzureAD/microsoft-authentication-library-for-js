import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { HomeComponent } from './home/home.component';
import { MsalGuard } from '@azure/msal-angular';
import { DetailComponent } from './detail/detail.component';
import { FailedComponent } from './failed/failed.component';

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
  }
];

const isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    // Don't perform initial navigation in iframes
    initialNavigation: !isIframe ? 'enabled' : 'disabled' // Remove this line to use Angular Universal
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
