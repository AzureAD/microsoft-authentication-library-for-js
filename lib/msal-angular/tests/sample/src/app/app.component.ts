import {Component, OnDestroy, OnInit} from '@angular/core';
import {BroadcastService, MsalService} from "ms-msal-angular";
import {ProductService} from "./product.service";
import {Subscription} from "rxjs/Subscription";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Msal Angular Demo';
  loggedIn : boolean;
  public userInfo: any = null;
  private subscription: Subscription;

  constructor(private broadcastService: BroadcastService , private authService : MsalService,   private productService: ProductService )
  {
   if(this.authService.getUser())
    {
      this.loggedIn = true;
    }
   else {
     this.loggedIn = false;
   }
  }


  login()
  {
   this.authService.login_redirect();
  }

  loginPopup()
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
      var userData = this.authService.get_user();
      console.log("getUser " + JSON.stringify(this.authService.get_user()));
      window.localStorage.setItem("userIdentifier" , userData.userIdentifier);
      window.localStorage.setItem("userData" , JSON.stringify(userData));

      this.loggedIn = true;
    });

  }

 ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
