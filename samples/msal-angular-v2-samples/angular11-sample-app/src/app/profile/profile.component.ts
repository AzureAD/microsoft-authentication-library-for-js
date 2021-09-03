import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me'; // Prod graph endpoint. Uncomment to use.
const GRAPH_ENDPOINT = 'https://graph.microsoft-ppe.com/v1.0/me';

type ProfileType = {
  givenName?: string,
  surname?: string,
  userPrincipalName?: string,
  id?: string
};

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile!: ProfileType;

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    // Ensures http calls are made client-side
    if (typeof window !== "undefined") {
      this.getProfile();
    }
  }

  getProfile() {
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
      });
  }
}
