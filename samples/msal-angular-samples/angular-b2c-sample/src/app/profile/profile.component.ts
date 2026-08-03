import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../environments/environment';

type ProfileType = {
  name?: string
};

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css'],
    standalone: false
})
export class ProfileComponent implements OnInit {
  profile!: ProfileType;

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getProfile(environment.apiConfig.uri);
  }

  getProfile(url: string) {
    this.http.get(url)
      .subscribe(profile => {
        console.log(profile);
        this.profile = profile;
      });
  }
}