import { NavigationClient } from "@azure/msal-browser";
import { navigate } from "gatsby";

/**
 * This is an example for overriding the default function MSAL uses to navigate to other urls in your webpage
 */
export class CustomNavigationClient extends NavigationClient{
    /**
     * Navigates to other pages within the same web application
     * You can use the useRouter hook provided by next.js to take advantage of client-side routing
     * @param url 
     * @param options 
     */
    async navigateInternal(url, options) {
        const relativePath = url.replace(window.location.origin, '');
        if (options.noHistory) {
            await navigate(relativePath, { replace: true });
        } else {
            await navigate(relativePath);
        }

        return false;
    }
}
