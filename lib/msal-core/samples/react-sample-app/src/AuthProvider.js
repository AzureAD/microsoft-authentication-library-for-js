import React, { Component } from "react";
import * as Msal from "msal";

const loginRequest = {
    scopes: ["openid", "profile", "User.Read"]
};

const tokenRequest = {
    scopes: ["Mail.Read"]
};

const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages"
};

const msalApp = new Msal.UserAgentApplication({
    auth: {
        clientId: "245e9392-c666-4d51-8f8a-bfd9e55b2456",
        authority: "https://login.microsoftonline.com/common",
        validateAuthority: true,
        postLogoutRedirectUri: "http://localhost:3000"
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: true
    }
});

const callMSGraph = async (url, accessToken) => {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.json();
};

const requiresInteraction = errorMessage => {
    if (!errorMessage || !errorMessage.length) {
        return false;
    }

    return (
        errorMessage.indexOf("consent_required") !== -1 ||
        errorMessage.indexOf("interaction_required") !== -1 ||
        errorMessage.indexOf("login_required") !== -1
    );
};

const isIE = () => {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf("MSIE ");
    const msie11 = ua.indexOf("Trident/");

    return msie > 0 || msie11 > 0;
};

export default C =>
    class AuthProvider extends Component {
        static propTypes = {};

        constructor(props) {
            super(props);
            this.state = {
                account: msalApp.getAccount()
            };

            msalApp.handleRedirectCallback(this.authRedirectCallBack);
        }

        acquireTokenAndCallMSGraph = async (endpoint, request, redirect) => {
            const tokenResponse = await msalApp
                .acquireTokenSilent(request)
                .catch(error => {
                    // Call acquireTokenPopup (popup window) in case of acquireTokenSilent failure due to consent or interaction required ONLY
                    if (requiresInteraction(error.errorCode)) {
                        return redirect
                            ? msalApp.acquireTokenRedirect(request)
                            : msalApp.acquireTokenPopup(request);
                    }
                });

            if (tokenResponse) {
                const graphResponse = await callMSGraph(
                    endpoint,
                    tokenResponse.accessToken
                );

                this.graphAPICallback(graphResponse);
            }
        };

        signIn = async () => {
            if (isIE()) {
                await msalApp.loginRedirect(loginRequest);
            } else {
                await msalApp.loginPopup(loginRequest);

                await this.acquireTokenAndCallMSGraph(
                    graphConfig.graphMeEndpoint,
                    tokenRequest
                );

                this.setState({
                    account: msalApp.getAccount()
                });
            }
        };

        signOut = () => {
            msalApp.logout();
        };

        readMail = async () =>
            this.acquireTokenAndCallMSGraph(
                graphConfig.graphMailEndpoint,
                tokenRequest
            );

        authRedirectCallBack = (error, response) => {
            if (error) {
                console.log(error);
            } else {
                if (response.tokenType === "access_token") {
                    callMSGraph(
                        graphConfig.graphMeEndpoint,
                        response.accessToken
                    ).then(this.graphAPICallback);
                } else {
                    console.log("token type is:" + response.tokenType);
                }
            }
        };

        graphAPICallback = graphData => {
            this.setState({
                graphData
            });
        };

        componentDidMount = () => {
            //If you support IE, our recommendation is that you sign-in using Redirect APIs
            //If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check

            if (
                this.state.account &&
                !msalApp.isCallback(window.location.hash)
            ) {
                const useRedirect = isIE();

                this.acquireTokenAndCallMSGraph(
                    graphConfig.graphMeEndpoint,
                    loginRequest,
                    useRedirect
                );
            }
        };

        render() {
            return (
                <C
                    {...this.props}
                    signIn={this.signIn}
                    signOut={this.signOut}
                    account={this.state.account}
                    readMail={this.readMail}
                    graphData={this.state.graphData}
                />
            );
        }
    };
