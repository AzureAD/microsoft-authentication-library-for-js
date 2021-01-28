import { Component, OnInit } from "@angular/core";
import { MsalService } from "@azure/msal-angular";

@Component({
  selector: 'app-redirect',
  template: ''
})
export class MsalRedirectComponent implements OnInit {
  
  constructor(private authService: MsalService) { }
  
  ngOnInit(): void {    
      this.authService.handleRedirectObservable().subscribe();
  }
  
}
