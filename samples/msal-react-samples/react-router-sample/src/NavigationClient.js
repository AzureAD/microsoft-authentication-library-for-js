import { NavigationClient } from "@azure/msal-browser";

export class CustomNavigationClient extends NavigationClient{
    constructor(history) {
        super();
        this.history = history;
    }

    /**
     * Navigates to other pages within the same web application
     * @param url 
     * @param options 
     */
    navigateInternal(url, options) {
        const relativePath = url.replace(window.location.origin, '');
        if (options.noHistory) {
            this.history.replace(relativePath);
        } else {
            this.history.push(relativePath);
        }

        return Promise.resolve(false);
    }
}
