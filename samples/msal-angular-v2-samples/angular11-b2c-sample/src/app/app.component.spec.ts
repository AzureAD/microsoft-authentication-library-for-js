import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MSAL_INSTANCE, MsalService } from '@azure/msal-angular';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { b2cPolicies, apiConfig } from './b2c-config';

function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '9067c884-9fa6-414f-9aa4-a565b1cb46be',
      authority: b2cPolicies.authorities.signUpSignIn.authority,
      redirectUri: 'http://localhost:4200',
      postLogoutRedirectUri: 'http://localhost:4200',
      knownAuthorities: [b2cPolicies.authorityDomain]
    }
  });
}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        MsalService,
        {
          provide: MSAL_INSTANCE,
          useFactory: MSALInstanceFactory
        }
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'MSAL Angular v2 B2C Sample'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('MSAL Angular v2 B2C Sample');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.title').textContent).toContain('MSAL Angular v2 B2C Sample');
  });
});
