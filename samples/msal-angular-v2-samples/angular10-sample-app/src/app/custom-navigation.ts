import { NavigationClient, NavigationOptions } from "@azure/msal-browser";
import { Router } from "@angular/router";

/**
 * Custom navigation used for client-side navigation.
 * See performance doc for details:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/performance.md
*/
export class CustomNavigationClient extends NavigationClient {
    private router: Router;

    constructor(router: Router) {
        super();
        this.router = router;
    }

    async navigateInternal(url:string, options: NavigationOptions): Promise<boolean> {
        this.router.navigateByUrl(url);
        return Promise.resolve(false);
    }
}
