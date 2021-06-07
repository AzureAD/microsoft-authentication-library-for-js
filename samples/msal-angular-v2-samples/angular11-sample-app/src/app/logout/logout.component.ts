import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { BrowserUtils } from "@azure/msal-browser";

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private authService: MsalService) {
    console.log('LOGOUT');

  }

  ngOnInit(): void {
    this.authService.logoutRedirect({
        // If in iframe, dont perform redirect to AAD
        onRedirectNavigate: () => {
            return !BrowserUtils.isInIframe();
        }
    });
  }

}
