import { Component, OnInit, Inject } from '@angular/core';
import { MSAL_INSTANCE } from '../msal';
import { IPublicClientApplication } from '@azure/msal-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(
    @Inject(MSAL_INSTANCE) private msalInstance: IPublicClientApplication
  ) { }

  ngOnInit(): void {
    this.msalInstance.handleRedirectPromise();
  }

}
