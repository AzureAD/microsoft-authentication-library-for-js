import { IMsalContext } from './MsalContext';
import {
    IPublicClientApplication,
    AuthenticationResult,
} from '@azure/msal-browser';

type FaaCFunction = (props: IMsalContext) => React.ReactNode;

export function getChildrenOrFunction(
    children: React.ReactNode | FaaCFunction,
    props: IMsalContext
): React.ReactNode {
    if (typeof children === 'function') {
        return children(props);
    }
    return children;
}

export function isAuthenticated(
    instance: IPublicClientApplication,
    username?: string
): boolean {
    return username
        ? !!instance.getAccountByUsername(username)
        : (instance.getAllAccounts() || []).length > 0;
}

export function defaultLoginHandler(
    context: IMsalContext
): Promise<AuthenticationResult> {
    const { instance } = context;
    return instance.loginPopup({ scopes: ['user.read'] });
}
