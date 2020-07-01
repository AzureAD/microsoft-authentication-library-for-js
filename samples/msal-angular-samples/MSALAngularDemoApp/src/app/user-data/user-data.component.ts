import {Component, OnInit} from '@angular/core';
import {BroadcastService} from "@azure/msal-angular";
import { MsalService} from "@azure/msal-angular";
import {HttpClient} from "@angular/common/http";
import {HttpServiceHelper} from "../common/HttpServiceHelper";
import {Subscription} from "rxjs/Subscription";


@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.css']
})
export class UserDataComponent implements OnInit {

  private subscription: Subscription;
  userData;
  url = "https://graph.microsoft.com/v1.0/me";

  constructor(private authService: MsalService, private http: HttpClient, private httpService: HttpServiceHelper, private broadcastService: BroadcastService) {
  }

  ngOnInit() {
    this.getUSerProfile();

    this.subscription = this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log("acquire token success " + JSON.stringify(payload));
    });

    //will work for acquireTokenSilent and acquireTokenPopup
    this.subscription = this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log("acquire token failure " + JSON.stringify(payload))
      if (payload.errorDesc.indexOf("consent_required") !== -1 || payload.errorDesc.indexOf("interaction_required") != -1) {
        this.authService.acquireTokenPopup(["user.read", "mail.send"]).then((token) => {
          this.getUSerProfile();
        }, (error) => {
        });
      }
    });
  }

  getUSerProfile() {
    this.httpService.httpGetRequest(this.url)
      .subscribe(data => {
        this.userData = data;
      }, error => {
        console.error(" Http get request to MS Graph failed" + JSON.stringify(error));
      });
  }

//extremely important to unsubscribe
  ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
