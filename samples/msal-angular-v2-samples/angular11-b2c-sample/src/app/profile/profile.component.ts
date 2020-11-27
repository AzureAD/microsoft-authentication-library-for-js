import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MsalService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';
import { apiConfig } from '../b2c-config';
import { InteractionType } from '@azure/msal-browser';

type ProfileType = {
  name?: String
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile!: ProfileType;

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private http: HttpClient,
    private authService: MsalService
  ) { }

  ngOnInit() {
    this.authService.handleRedirectObservable().subscribe({
      next: (result) => {
        this.http.get(apiConfig.uri).toPromise()
        .then(profile => {
          this.profile = profile;
        });
        return result;
      },
      error: (error) => console.log(error)
    });

    this.getProfile(apiConfig.uri, apiConfig.scopes);
  }

  getProfile(url: string, scopes: string[]) {
    
    this.http.get(url).toPromise()
      .then(profile => {
        this.profile = profile;
      })
      .catch(error => {
        console.log(error);
        if (error.status === 401) {
          if (this.msalGuardConfig.interactionType === InteractionType.Popup) {
            this.authService.acquireTokenPopup({
              scopes: scopes
            }).subscribe(() => {
              this.http.get(url).toPromise()
                .then(profile => {
                  this.profile = profile;
                });
            });
          } else {
            this.authService.acquireTokenRedirect({
              scopes: scopes
            });
          }
        }
      });
  }
}
