import { Component, OnInit } from '@angular/core';
import { MsalService } from '../msal';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private authService: MsalService) { }

  ngOnInit(): void {
    // This route should be registered as the "Logout URL" in the portal.
    // It will be navigated to when other applications logout.
    // On page load, invoke the MSAL logout function to complete SSO logout for this app.
    this.authService.logout();
  }

}
