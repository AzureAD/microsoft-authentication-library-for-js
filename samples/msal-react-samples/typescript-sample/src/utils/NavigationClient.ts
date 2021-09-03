import { NavigationClient, NavigationOptions } from "@azure/msal-browser";
import { History } from "history";

/**
 * This is an example for overriding the default function MSAL uses to navigate to other urls in your webpage
 */
export class CustomNavigationClient extends NavigationClient{
    private history: History;

    constructor(history: History) {
        super();
        this.history = history;
    }

    /**
     * Navigates to other pages within the same web application
     * You can use the useHistory hook provided by react-router-dom to take advantage of client-side routing
     * @param url 
     * @param options 
     */
    async navigateInternal(url: string, options: NavigationOptions) {
        const relativePath = url.replace(window.location.origin, '');
        if (options.noHistory) {
            this.history.replace(relativePath);
        } else {
            this.history.push(relativePath);
        }

        return false;
    }
}