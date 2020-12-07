# Multi-Tenant

By default, there is multi-tenant support for your application since MSAL sets the tenant in the authority to 'common' if it is not specified in the config. This allows any Microsoft account to authenticate to your application. If you are not interested in multi-tenant behavior, you will need to set the `authority` config property when instantiating MSAL in the `app.module.ts` as shown below.

```js
@NgModule({
  imports: [
    MsalModule.forRoot({ // MSAL Configuration
      auth: {
        clientId: 'CLIENT_ID_HERE',
        authority: 'https://login.microsoftonline.com/TENANT_ID_HERE',
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
      },
      // Additional configuration here
    });
  ]
})
export class AppModule {}
```

If you allow multi-tenant authentication, and you do not wish to allow all Microsoft account users to use your application, you must provide your own method of filtering the token issuers to only those tenants who are allowed to login.

## Changing the tenant
The tenant can also be set dynamically by instantiating a new instance of MSAL in the relevant component, as shown below.

```js
import { PublicClientApplication } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

@Component({})
export class AppComponent implements OnInit {
  constructor(
    private authService: MsalService
  ) {}

  ngOnInit(): void {
    this.authService.instance = new PublicClientApplication({
      auth: {
        clientId: 'CLIENT_ID_HERE',
        authority: 'https://login.microsoftonline.com/TENANT_ID_HERE',
        redirectUri: 'http://localhost:4200',
        postLogoutRedirectUri: 'http://localhost:4200'
      }
    });
  }
```
