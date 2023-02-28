import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const GRAPH_ENDPOINT = 'https://graph.microsoft.com/v1.0/me';
// const GRAPH_ENDPOINT = 'https://graph.microsoft-ppe.com/v1.0/me'; // PPE testing environment

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
    this.http.get(GRAPH_ENDPOINT)
      .subscribe(profile => {
        this.profile = profile;
      });
  }
}
