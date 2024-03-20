import { Routes, withDisabledInitialNavigation, withEnabledBlockingInitialNavigation } from '@angular/router';
import { BrowserUtils } from '@azure/msal-browser';
import { FailedComponent } from './failed/failed.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { MsalGuard } from '@azure/msal-angular';

// export const routes: Routes = [];
export const initialNavigation = !BrowserUtils.isInIframe() && !BrowserUtils.isInPopup() 
    ? withEnabledBlockingInitialNavigation() // Set to enabledBlocking to use Angular Universal
    : withDisabledInitialNavigation(); 

export const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [MsalGuard]
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