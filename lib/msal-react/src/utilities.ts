import { IPublicClientApplication } from "@azure/msal-browser";

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
