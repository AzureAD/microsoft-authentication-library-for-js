import { Component, OnInit } from '@angular/core';
import { MsalService } from './msal';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Angular 10 - MSAL Browser Sample';
  isIframe = false;
  loggedIn = false;

  constructor(private authService: MsalService) {}
  ngOnInit(): void {
    this.isIframe = window !== window.parent && !window.opener;

    this.checkAccount();
  }

  checkAccount() {
    this.loggedIn = this.authService.getAllAccounts().length > 0;
  }

  login() {
    this.authService.loginPopup()
      .subscribe(() => this.checkAccount());
  }

  logout() {
    this.authService.logout();
  }
}
