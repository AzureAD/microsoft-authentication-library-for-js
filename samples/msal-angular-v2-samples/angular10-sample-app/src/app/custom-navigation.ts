import { NavigationClient, NavigationOptions, UrlString } from "@azure/msal-browser";
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
        const urlComponents = new UrlString(url).getUrlComponents();
        const joinedPathSegments = urlComponents.PathSegments.join("/");
        const newUrl = urlComponents.QueryString ? `/${joinedPathSegments}?${urlComponents.QueryString}` : `/${joinedPathSegments}`;
        this.router.navigateByUrl(newUrl);
        return Promise.resolve(false);
    }
}
