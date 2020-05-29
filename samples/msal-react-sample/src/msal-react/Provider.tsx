import React, { useContext, useEffect, useState } from "react";
import PropTypes from 'prop-types';

import { PublicClientApplication, Configuration, AuthenticationParameters, TokenResponse, TokenRenewParameters, Account } from "@azure/msal-browser";

export const MsalContext = React.createContext<IPublicClientApplication & IProviderState | null>(null);

interface IProviderProps {
    configuration: Configuration
}

interface IProviderState {
    account: Account
}
export const IPublicClientApplicationPropType = PropTypes.shape({
    acquireTokenPopup: PropTypes.func.isRequired,
    acquireTokenRedirect: PropTypes.func.isRequired,
    acquireTokenSilent: PropTypes.func.isRequired,
    getAccount: PropTypes.func.isRequired,
    handleRedirectPromise: PropTypes.func.isRequired,
    loginPopup: PropTypes.func.isRequired,
    loginRedirect: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    ssoSilent: PropTypes.func.isRequired
});

export interface IPublicClientApplication {
    acquireTokenPopup(request: AuthenticationParameters): Promise<TokenResponse>;
    acquireTokenRedirect(request: AuthenticationParameters): void;
    acquireTokenSilent(silentRequest: TokenRenewParameters): Promise<TokenResponse>;
    getAccount(): Account;
    handleRedirectPromise(): Promise<TokenResponse | null>;
    loginPopup(request: AuthenticationParameters): Promise<TokenResponse>;
    loginRedirect(request: AuthenticationParameters): void;
    logout(): void;
    ssoSilent(request: AuthenticationParameters): Promise<TokenResponse>;
}

export function useHandleRedirect(): [ TokenResponse | null ] {
    const context = useContext(MsalContext);
    const [ redirectResponse, setRedirectResponse ] = useState<TokenResponse | null>(null);

    useEffect(() => {
        context?.handleRedirectPromise()
            .then(response => setRedirectResponse(response));
            // TODO: error handling
    }, []);

    return [ redirectResponse ];
}

export const withMsal = (configuration:Configuration) => (C:React.ComponentType) => (props:any) => {
    return (
        <Provider configuration={configuration}>
            <Consumer>
                {msal => (
                    <C
                        {...props}
                        msal={msal}
                    />
                )}
            </Consumer>
        </Provider>
    )
}

export function useAuthenticate(): boolean{
    const context = useContext(MsalContext);
    const [ authenticated, setAuthenticated ] = useState<boolean>(!!context?.getAccount());

    async function loginInteractively(): Promise<void> {
        return context?.loginPopup({})
        .then(() => {
            setAuthenticated(true)
        })
        .catch((error) => {
            console.log(error)
            setAuthenticated(false)
        })
    }

    useEffect(() => {
        if (authenticated) {
            const account = context?.getAccount();
            context?.ssoSilent({loginHint: account!.userName})
            .then(() => setAuthenticated(true))
            .catch((error) => {
                console.log(error);
                loginInteractively()
            });
        } else {
            loginInteractively();
        }
    }, []);

    return authenticated
}

export function AuthenticatedComponent(props:any) {
    const isAuthenticated = useAuthenticate();
    return isAuthenticated && props.children;
}

export class UnauthenticatedComponent extends React.Component {
    render() {
        return (
            <Consumer>
                {msal => !msal?.getAccount() && this.props.children}
            </Consumer>
        );
    }
}

export class Provider extends React.Component<IProviderProps, IProviderState> {
    private instance: PublicClientApplication;
    private wrappedInstance: IPublicClientApplication;

    constructor(props: any) {
        super(props);

        this.instance = new PublicClientApplication(props.configuration);

        this.wrappedInstance = {
            acquireTokenPopup: this.instance.acquireTokenPopup.bind(this.instance),
            acquireTokenRedirect: this.instance.acquireTokenRedirect.bind(this.instance),
            acquireTokenSilent: this.instance.acquireTokenSilent.bind(this.instance),
            getAccount: this.instance.getAccount.bind(this.instance),
            handleRedirectPromise: async (): Promise<TokenResponse | null> => {
                const response = await this.instance.handleRedirectPromise.call(this.instance);
                const account = this.instance.getAccount.call(this.instance);
                this.setState({
                    account
                });
                return response;
            },
            loginPopup: async (request: AuthenticationParameters): Promise<TokenResponse> => {
                const response = await this.instance.loginPopup.call(this.instance, request);
                const account = this.instance.getAccount.call(this.instance);
                this.setState({
                    account
                });
                return response;
            },
            loginRedirect: this.instance.loginRedirect.bind(this.instance),
            logout: this.instance.logout.bind(this.instance),
            ssoSilent: async (request: AuthenticationParameters): Promise<TokenResponse> =>{
                const response = await this.instance.ssoSilent.call(this.instance, request);
                const account = this.instance.getAccount.call(this.instance);
                this.setState({
                    account
                });
                return response;
            },
        }

        this.state = {
            account: this.instance.getAccount.call(this.instance)
        };
    }


    render() {

        return (
            <MsalContext.Provider value={{
                ...this.wrappedInstance,
                ...this.state
            }}>
                {this.props.children}
            </MsalContext.Provider>
        );
    }
}

export const Consumer = MsalContext.Consumer;
