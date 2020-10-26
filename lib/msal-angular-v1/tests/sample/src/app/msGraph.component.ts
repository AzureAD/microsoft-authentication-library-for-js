import {Component, OnDestroy, OnInit} from "@angular/core";
import {BroadcastService, MsalService} from "../../../../dist";
import {Subscription} from "rxjs/Subscription";
import {MsGraphService} from "./msGraph.service";

@Component({
  templateUrl: './msGraph.component.html',
})

export class MsGraphComponent implements OnInit, OnDestroy{
  public userInfo: any = null;
  public calendarInfo: any ;
  private subscription: Subscription;
  private loadingMessage = "Loading...";

  constructor(private authService: MsalService, private msGraphService: MsGraphService, private broadcastService: BroadcastService) {

  }


  private getAcquireToken = function (self, scopes) {
    //acquire access token for scopes
    return new Promise(function (resolve, reject) {
      self.acquire_token_silent(scopes).then(function (token) {
        resolve(token);
      }, function (error) {
        //This will fail, if scopes were not consented. call acquire token interactive only for these 2 errors
        if (error.indexOf("consent_required") != -1 || error.indexOf("interaction_required") != -1) {
          self.acquire_token_popup(scopes).then(function (token) {
            resolve(token);
          }, function (error) {
            reject(error);
          })
        }
        else {
          reject(error);
        }
      })
    });
  }

  ngOnInit() {
    this.getCalendar();
    //will work for acquireTokenSilent and acquireTokenPopup
   this.subscription= this.broadcastService.subscribe("msal:acquireTokenSuccess", (payload) => {
      console.log("acquire token success " + JSON.stringify(payload));
   });

    //will work for acquireTokenSilent and acquireTokenPopup
    this.subscription=  this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {
      console.log("acquire token failure " + JSON.stringify(payload))
      if (payload.errorDesc.indexOf("consent_required") !== -1 || payload.errorDesc.indexOf("interaction_required") != -1) {
        this.authService.acquireTokenPopup(["calendars.read"]).then( (token) => {
          this.getCalendar();
        },  (error) => {
          this.loadingMessage = "";
        });
      }
    });

  }

  getCalendar() {
    this.msGraphService.httpGetRequest()
      .subscribe(data => {
        this.calendarInfo= data.value;
        this.loadingMessage = "";

      }, error => {
        console.error(" access token silent failed " + JSON.stringify(error));
        this.loadingMessage = "";

      });
  }

  convertUTCToLocalTime(utcTime : string): any
  {
    var offset = new Date().getTimezoneOffset();
    var utcDate = new Date(utcTime );
    utcDate.setMinutes(utcDate.getMinutes() - offset);
    return  utcDate.toDateString() + " " + utcDate.toLocaleTimeString();
  }

  //extremely important to unsubscribe
  ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }

}
