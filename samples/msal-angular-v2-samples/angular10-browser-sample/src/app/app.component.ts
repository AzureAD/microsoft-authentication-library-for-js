import { Component, OnInit, Inject } from '@angular/core';
import { MsalService } from './msal';
import { MSAL_GUARD_CONFIG, InteractionType } from './msal/constants';
import { MsalGuardConfiguration } from './msal/msal.guard.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Angular 10 - MSAL Browser Sample';
  isIframe = false;
  loggedIn = false;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService
  ) {}
  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();
  }

  checkAccount() {
    this.loggedIn = this.authService.getAllAccounts().length > 0;
  }

  login() {
    if (this.msalGuardConfig.interactionType === InteractionType.POPUP) {
      this.authService.loginPopup()
        .subscribe(() => this.checkAccount());
    } else {
      this.authService.loginRedirect();
    }
  }

  logout() {
    this.authService.logout();
  }
}
