import { Component, OnInit } from '@angular/core';
import { MsalService} from "ms-msal-angular";

@Component({
  selector: 'app-user-data',
  templateUrl: './user-data.component.html',
  styleUrls: ['./user-data.component.css']
})
export class UserDataComponent implements OnInit {

  constructor(private authService : MsalService) { }
 userData;
  ngOnInit() {
this.userData=   this.authService.get_user().userIdentifier.replace(/\"/g, "");
//test.replace(/\"/g, "")
console.log(this.userData);

  }

}
