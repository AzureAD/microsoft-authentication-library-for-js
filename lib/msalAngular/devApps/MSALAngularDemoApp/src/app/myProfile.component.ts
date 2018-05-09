import {Component} from "@angular/core";
import {ProductService} from "./product.service";
import {BroadcastService, MsalService} from "../../../../dist";

@Component({
  templateUrl: './myProfile.component.html',
})

export class MyProfileComponent
{
  public apiCallFailed: boolean;
  loggedIn : boolean;
  public userInfo: any = null;

  constructor( private authService: MsalService, private productService:ProductService,  private broadcastService: BroadcastService){

  }


  ngOnInit() {
    this.broadcastService.subscribe("msal:loginFailure", (payload) => {
    });

    this.broadcastService.subscribe("msal:loginSuccess", (payload) => {
    });

    this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log("acquire token success " +  JSON.stringify(payload))
    });

    this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log("acquire token failure " +  JSON.stringify(payload))
    });

  }


  private callGraph() {
    this.apiCallFailed = false;
        this.productService.getUserInfo()
          .subscribe(data => {
            this.userInfo = data;
          }, error => {
            console.error(" access token silent failed "+ error);
          this.authService.acquire_token_popup(["user.read", "mail.send"]).then( token => {
            console.log("acquire token popup success");
            this.productService.getUserInfo()
              .subscribe(data => {
                this.userInfo = data;
                this.apiCallFailed = false;
              })
            }
          )
            this.apiCallFailed = true;
          });
  }
}
