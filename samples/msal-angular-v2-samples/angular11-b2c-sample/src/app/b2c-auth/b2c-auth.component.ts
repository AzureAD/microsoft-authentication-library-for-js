import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

@Component({
  template: ''
})
export class B2cAuthComponent implements OnInit {

  constructor(private authService: MsalService) { }

  ngOnInit(): void {
    console.log("B2C Component hit");
    
    this.authService.handleRedirectObservable().subscribe({
      next: () => {console.log("b2c auth")},
      error: (error) => console.log(error)
    });
  }

}
