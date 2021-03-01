/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testAccount, testResult, TEST_CONFIG } from "../TestConstants";
import { MsalProvider, MsalAuthenticationTemplate, MsalAuthenticationResult, IMsalContext, useMsal } from "../../src/index";
import { PublicClientApplication, Configuration, InteractionType, EventType, AccountInfo, EventCallbackFunction, EventMessage, PopupRequest, AuthError } from "@azure/msal-browser";

describe("MsalAuthenticationTemplate tests", () => {
    let pca: PublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    };

    let eventCallbacks: EventCallbackFunction[];
    let handleRedirectSpy: jest.SpyInstance;
    let accounts: AccountInfo[] = [];  

    beforeEach(() => {
        eventCallbacks = [];
        let eventId = 0;
        pca = new PublicClientApplication(msalConfig);
        jest.spyOn(pca, "addEventCallback").mockImplementation((callbackFn) => {
            eventCallbacks.push(callbackFn);
            eventId += 1;
            return eventId.toString();
        });
        handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            return Promise.resolve(null);
        });

        jest.spyOn(pca, "getAllAccounts").mockImplementation(() => accounts);
    });

    afterEach(() => {
    // cleanup on exiting
        jest.clearAllMocks();
        accounts = [];
    });

    test("Calls loginPopup if no account is signed in", async () => {              
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation((request) => {
            expect(request).toBe(undefined);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Popup,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            
            return Promise.resolve(testResult);
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Popup}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginPopupSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Calls loginRedirect if no account is signed in", async () => {              
        const loginRedirectSpy = jest.spyOn(pca, "loginRedirect").mockImplementation((request) => {
            expect(request).toBe(undefined);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Redirect,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve();
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Redirect}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Calls ssoSilent if no account is signed in", async () => {              
        const ssoSilentSpy = jest.spyOn(pca, "ssoSilent").mockImplementation((request) => {
            expect(request).toBe(undefined);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Silent,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve(testResult);
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Silent}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(ssoSilentSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Calls loginPopup with provided request if no account is signed in", async () => {
        const loginRequest: PopupRequest = {
            scopes: ["openid"],
            redirectUri: "http://localhost"
        };            
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation((request) => {
            expect(request).toBe(loginRequest);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Popup,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            
            return Promise.resolve(testResult);
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Popup} authenticationRequest={loginRequest}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginPopupSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Calls loginRedirect with provided request if no account is signed in", async () => {       
        const loginRequest: PopupRequest = {
            scopes: ["openid"],
            redirectUri: "http://localhost"
        };       
        const loginRedirectSpy = jest.spyOn(pca, "loginRedirect").mockImplementation((request) => {
            expect(request).toBe(loginRequest);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Redirect,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve();
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Redirect} authenticationRequest={loginRequest}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Calls ssoSilent with provided request if no account is signed in", async () => {
        const loginRequest: PopupRequest = {
            scopes: ["openid"]
        };              
        const ssoSilentSpy = jest.spyOn(pca, "ssoSilent").mockImplementation((request) => {
            expect(request).toBe(loginRequest);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Silent,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve(testResult);
        });

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Silent} authenticationRequest={loginRequest}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(ssoSilentSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("LoginRedirect is not called if handleRedirectPromise returns an error", async () => {
        const error = new AuthError("login_failed");
        handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: error,
                timestamp: 10000
            };

            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            return Promise.reject(error);
        });
        const loginRedirectSpy = jest.spyOn(pca, "loginRedirect").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: error,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            
            return Promise.reject(error);
        });

        const errorMessage = ({error}: MsalAuthenticationResult) => {
            if (error) {
                return <p>Error Occurred: {error.errorCode}</p>;
            }

            return null;
        };

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Redirect} errorComponent={errorMessage}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(await screen.findByText("Error Occurred: login_failed")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
        expect(loginRedirectSpy).toHaveBeenCalledTimes(0);
    });

    test("If user is signed in and MsalAuthenticationTemplate is rendered after MsalProvider, child renders and login is not called", async () => {
        const loginRedirectSpy = jest.spyOn(pca, "loginRedirect");
        accounts = [testAccount];

        const TestComponent = () => {
            const {inProgress} = useMsal();

            if (inProgress === "none") {
                return (
                    <MsalAuthenticationTemplate interactionType={InteractionType.Redirect}>
                        <span> A user is authenticated!</span>
                    </MsalAuthenticationTemplate>
                );
            } else {
                return null;
            }
        };

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <TestComponent />
            </MsalProvider>
        );

        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(await screen.findByText("A user is authenticated!")).toBeInTheDocument();
        expect(loginRedirectSpy).not.toHaveBeenCalled();
    });

    test("Renders provided error component when an error occurs", async () => {
        const error = new AuthError("login_failed");
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Popup,
                payload: null,
                error: error,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            
            return Promise.reject(error);
        });

        const errorMessage = ({error}: MsalAuthenticationResult) => {
            if (error) {
                return <p>Error Occurred: {error.errorCode}</p>;
            }

            return null;
        };

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Popup} errorComponent={errorMessage}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginPopupSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(await screen.findByText("Error Occurred: login_failed")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });

    test("Provided error component can resolve error by calling login again, child renders after success", async () => {
        const error = new AuthError("login_failed");
        const ssoSilentSpy = jest.spyOn(pca, "ssoSilent").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Silent,
                payload: null,
                error: error,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            
            return Promise.reject(error);
        });

        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation((request) => {
            expect(request).toBe(undefined);
            accounts = [testAccount];
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Popup,
                payload: testResult,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve(testResult);
        });

        const ErrorMessage = ({error, login}: MsalAuthenticationResult) => {            
            return (
                <>
                    <p>Error Occurred: {error?.errorCode}</p>
                    <button onClick={() => login(InteractionType.Popup)}>Retry</button>
                </>
            );
        };

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Silent} errorComponent={ErrorMessage}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

        // Verify Error Component rendered
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        await waitFor(() => expect(ssoSilentSpy).toHaveBeenCalledTimes(1));
        expect(await screen.findByText("Error Occurred: login_failed")).toBeInTheDocument();
        const retryButton = await screen.findByRole("button", {name: "Retry"});
        expect(retryButton).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();

        // Verify the Error Component has access to the login function and successful login causes MsalAuthenticationTemplate to rerender with child
        fireEvent.click(retryButton);
        await waitFor(() => expect(loginPopupSpy).toHaveBeenCalledTimes(1));
        expect(await screen.findByText("A user is authenticated!")).toBeInTheDocument();
        expect(screen.queryByText("Error Occurred: login_failed")).not.toBeInTheDocument();
    });

    test("Renders provided loading component when interaction is in progress", async () => {
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            expect(eventCallbacks.length).toBe(3);
            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });

            return Promise.resolve(testResult);
        });

        const loadingMessage = ({inProgress}: IMsalContext) => {
            return <p>In Progress: {inProgress}</p>;
        };

        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <MsalAuthenticationTemplate interactionType={InteractionType.Popup} loadingComponent={loadingMessage}>
                    <span> A user is authenticated!</span>
                </MsalAuthenticationTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(loginPopupSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(await screen.findByText("In Progress: login")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });
});
