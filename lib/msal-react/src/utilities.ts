import { IMsalContext } from "./MsalContext";
import {
    IPublicClientApplication,
    AuthenticationResult,
} from "@azure/msal-browser";

type FaaCFunction = <T>(args: T) => React.ReactNode;

export function getChildrenOrFunction<T>(
    children: React.ReactNode | FaaCFunction,
    args: T
): React.ReactNode {
    if (typeof children === "function") {
        return children(args);
    }
    return children;
}

export function isAuthenticated(
    instance: IPublicClientApplication,
    username?: string
): boolean {
    // TODO: Remove the `|| []` hack when the @azure/msal-browser is updated
    return username
        ? !!instance.getAccountByUsername(username)
        : (instance.getAllAccounts() || []).length > 0;
}

export function defaultLoginHandler(
    context: IMsalContext
): Promise<AuthenticationResult> {
    const { instance } = context;
    return instance.loginPopup({
        scopes: ["user.read"],
        prompt: "select_account",
    });
}
