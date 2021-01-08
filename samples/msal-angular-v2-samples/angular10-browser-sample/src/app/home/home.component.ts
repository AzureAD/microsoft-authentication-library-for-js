import { Component, OnInit } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { MsalService } from '../msal';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private authService: MsalService) { }

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe({
      next: (result: AuthenticationResult) => {
        if (result) {
          this.authService.instance.setActiveAccount(result.account);
          console.log(result);
        }
      },
      error: (error) => console.log(error)
    });
  }

}
