import { Component } from '@angular/core';
import {BroadcastService, MsalService} from "../../../../dist";
import {ProductService} from "./product.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Msal Angular Demo';
  loggedIn : boolean;
  public userInfo: any = null;

  constructor(private broadcastService: BroadcastService , private authService : MsalService,   private productService: ProductService)
  {
    //Can be use, if don't want to rely on msal:loginSuccess
   /*if(this.authService.getUser())
    {
      this.loggedIn = true;
    } */
  }

  login()
  {
   this.authService.login_popup();
  }

  logout()
  {
   this.authService.logout();
  }


  ngOnInit() {

    this.broadcastService.subscribe("msal:loginFailure", (payload) => {
      console.log("login failure");
      this.loggedIn = false;

    });

    this.broadcastService.subscribe("msal:loginSuccess", (payload) => {
      console.log("login success");
      this.loggedIn = true;
    });

  }

}
