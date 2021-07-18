import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { apiConfig } from '../b2c-config';

type ProfileType = {
  name?: string
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
    this.getProfile(apiConfig.uri);
  }

  getProfile(url: string) {
    this.http.get(url)
      .subscribe(profile => {
        console.log(profile);
        this.profile = profile;
      });
  }
}
