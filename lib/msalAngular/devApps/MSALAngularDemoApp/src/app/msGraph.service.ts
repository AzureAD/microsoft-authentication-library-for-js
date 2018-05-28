import {Observable} from 'rxjs/Rx'
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";

@Injectable()
export class MsGraphService {

  private startDate = new Date();
  private endDate = new Date();
  private url : string;

  constructor(private http: HttpClient) {
    this.endDate.setDate(this.startDate.getDate()+7);
     this.url = "https://graph.microsoft.com/beta/me/calendarview?startdatetime=" +this.startDate.toLocaleDateString("en-US") + "&enddatetime="+ this.endDate.toLocaleDateString("en-US")+ "&$select=subject,start,end&$orderBy=start/dateTime";
  }

  public httpGetRequest() {
    return this.http.get(this.url)
      .map(response => {
        return response;
      })
      .catch(response => (Observable.throw(response)
      ))
  }

}
