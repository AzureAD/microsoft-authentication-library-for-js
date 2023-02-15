import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type DetailType = {
  displayName?: string
  jobTitle?: string
}

@Component({
  selector: 'app-profile',
  templateUrl: './detail.component.html'
})
export class DetailComponent implements OnInit {
  profile!: DetailType;

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    this.getMore();
  }

  getMore() {
    this.http.get('https://graph.microsoft.com/v1.0/me')
      .subscribe(profile => {
        this.profile = profile;
      });
  }
}
