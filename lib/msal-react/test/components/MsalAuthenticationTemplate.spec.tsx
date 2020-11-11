/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testAccount, testResult, TEST_CONFIG } from "../TestConstants";
import { MsalProvider, MsalAuthenticationTemplate, MsalAuthenticationResult, IMsalContext } from "../../src/index";
import { PublicClientApplication, Configuration, InteractionType, EventType, AccountInfo, EventCallbackFunction, EventMessage, PopupRequest, AuthError } from "@azure/msal-browser";

describe("MsalAuthenticationTemplate tests", () => {
    let pca: PublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    };

    let eventCallback: EventCallbackFunction;
    let handleRedirectSpy: jest.SpyInstance;
    let accounts: AccountInfo[] = [];  

    beforeEach(() => {
        pca = new PublicClientApplication(msalConfig);
        jest.spyOn(pca, "addEventCallback").mockImplementation((callbackFn) => {
            eventCallback = callbackFn;
            return "callbackId";
        });
        handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
            
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
            
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
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
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
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

    test("Renders provided error component when an error occurs", async () => {
        const error = new AuthError("login_failed");
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Popup,
                payload: null,
                error: error,
                timestamp: 10000
            }
            eventCallback(eventMessage);
            
            return Promise.reject(error);
        });

        const errorMessage = ({error}: MsalAuthenticationResult) => {
            if (error) {
                return <p>Error Occurred: {error.errorCode}</p>
            }

            return null;
        }

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

    test("Renders provided loading component when interaction is in progress", async () => {
        const loginPopupSpy = jest.spyOn(pca, "loginPopup").mockImplementation(() => {
            let eventMessage: EventMessage = {
                eventType: EventType.LOGIN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
            return Promise.resolve(testResult);
        });

        const loadingMessage = ({inProgress}: IMsalContext) => {
            return <p>In Progress: {inProgress}</p>
        }

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
