# Angular Universal SSR with MSAL Angular v2

Angular Universal is minimally supported in `@azure/msal-angular`. As `@azure/msal-angular` is a wrapper library for `@azure/msal-browser`, which uses browser-only global objects such as `window` and `location` objects, not all of `@azure/msal-angular`'s features are available when using Angular Universal. While login and token acquisition is not supported server-side, Angular Universal can be used with `@azure/msal-angular` without breaking your app.

Please see instructions from the [Angular docs](https://angular.io/guide/universal) on how to install Angular Universal with an existing application, and for more information on [browser-only global objects](https://angular.io/guide/universal#working-around-the-browser-apis).

To use `@azure/msal-angular` with Angular Universal, make the following adjustments:

1. Remove references to browser-only objects. Our [Angular 11 sample app](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app) has comments next to relevant lines that should be removed to render server-side. Removing these lines will not affect the sample app if using Angular Universal.

    ```ts 
    this.isIframe = window !== window.parent && !window.opener; // Remove this line to use Angular Universal
    ```

1. Alternatively, checks could be added before any lines that use browser-only global objects. 

    ```ts
    if (typeof window !== "undefined") {
        this.isIframe = window !== window.parent && !window.opener;
    }
    ```

1. The same check should be added to any HTTP calls made by your app, as the `MsalInterceptor` currently uses browser-only objects. This will be addressed in a future fix. See the example below in the *profile.component.ts* from our [Angular 11 sample app](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app):

    ```ts
    export class ProfileComponent implements OnInit {
    profile!: ProfileType;

        constructor(
            private http: HttpClient
        ) { }

        ngOnInit() {
            // This check is added to ensure HTTP calls are made client-side
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
    ```

1. Ensure that your app is not using hash routing. The default routing strategy for the [Angular 11 sample app](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app) is hash routing, so ensure `useHash` is set to `false` in the *app-routing.module.ts*:

    ```ts
    @NgModule({
        imports: [RouterModule.forRoot(routes, {
            useHash: false,
            initialNavigation: 'enabled'
        })],
        exports: [RouterModule]
    })
    export class AppRoutingModule { }
    ```
