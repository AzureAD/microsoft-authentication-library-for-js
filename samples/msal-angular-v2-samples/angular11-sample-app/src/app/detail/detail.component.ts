import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';

const GRAPH_ENDPOINT = environment.protectedResources.graphApi.endpoint;

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
