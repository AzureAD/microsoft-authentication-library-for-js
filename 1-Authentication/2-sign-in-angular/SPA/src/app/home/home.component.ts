import { Component, Inject, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { MsalBroadcastService, MsalGuardConfiguration, MsalService, MSAL_GUARD_CONFIG } from '@azure/msal-angular';
import { AuthenticationResult, InteractionStatus, InteractionType } from '@azure/msal-browser';

import { createClaimsTable } from '../claim-utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  loginDisplay = false;
  dataSource: any = [];
  displayedColumns: string[] = ['claim', 'value', 'description'];

  private readonly _destroying$ = new Subject<void>();

  constructor(
    @Inject(MSAL_GUARD_CONFIG)
    private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) { }

  ngOnInit(): void {

    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None)
      )
      .subscribe(() => {
        this.setLoginDisplay();
        this.getClaims(
          this.authService.instance.getActiveAccount()?.idTokenClaims
        );
      });
  }

  setLoginDisplay() {
    this.loginDisplay = this.authService.instance.getAllAccounts().length > 0;
  }

  getClaims(claims: any) {
    if (claims) {
      const claimsTable = createClaimsTable(claims);
      this.dataSource = [...claimsTable];
    }
  }

  signUp() {
    if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
      this.authService.loginPopup({
        scopes: [],
        prompt: 'create',
      })
        .subscribe((response: AuthenticationResult) => {
          this.authService.instance.setActiveAccount(response.account);
        });
    } else {
      this.authService.loginRedirect({
        scopes: [],
        prompt: 'create',
      });
    }

  }

  // unsubscribe to events when component is destroyed
  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
