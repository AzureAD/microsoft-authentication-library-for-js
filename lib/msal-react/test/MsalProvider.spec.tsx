/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable react/no-multi-comp */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AccountInfo, Configuration, EventCallbackFunction, EventMessage, EventType, InteractionType, InteractionStatus, PublicClientApplication } from "@azure/msal-browser";
import { testAccount, TEST_CONFIG } from "./TestConstants";
import { IMsalContext, MsalConsumer, MsalProvider } from "../src/index";

describe("MsalProvider tests", () => {
    let pca: PublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    };

    let eventCallbacks: EventCallbackFunction[];
    let cachedAccounts: AccountInfo[] = [];
    let handleRedirectSpy: jest.SpyInstance;

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
            const eventStart: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            eventCallbacks.forEach((callback) => {
                callback(eventStart);
            });

            const eventEnd: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            eventCallbacks.forEach((callback) => {
                callback(eventEnd);
            });
            return Promise.resolve(null);
        });

        jest.spyOn(pca, "getAllAccounts").mockImplementation(() => cachedAccounts);
    });

    afterEach(() => {
        // cleanup on exiting
        jest.restoreAllMocks();
        jest.clearAllMocks();
        cachedAccounts = [];
    });

    describe("Event callback tests", () => {
        test("HandleRedirect Start and End", async () => {
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.HandleRedirect) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("inProgress is set to None even if handleRedirectPromise is called before MsalProvider is rendered", async () => {
            jest.restoreAllMocks();

            const TestComponent = ({inProgress}: IMsalContext) => {    
                if (inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else {
                    return <p>Interaction Status: { inProgress }</p>;
                }
            };

            await pca.handleRedirectPromise();
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("Account Added", async () => {              
            const TestComponent = ({accounts}: IMsalContext) => {
                if (accounts.length === 1) {
                    return <p>Test Success!</p>;
                }

                return null;
            };

            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            cachedAccounts = [];

            const eventMessage = {
                eventType: EventType.ACCOUNT_ADDED,
                interactionType: null,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    cachedAccounts = [testAccount];
                    callback(eventMessage);
                });
            });

            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("Account Removed", async () => {              
            const TestComponent = ({accounts}: IMsalContext) => {    
                if (accounts.length === 0) {
                    return <p>Test Success!</p>;
                }

                return null;
            };

            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            cachedAccounts = [testAccount];

            const eventMessage = {
                eventType: EventType.ACCOUNT_REMOVED,
                interactionType: null,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    cachedAccounts = [];
                    callback(eventMessage);
                });
            });

            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("LOGIN_SUCCESS event does not reset inProgress while handleRedirect is in progress", async () => {
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.HandleRedirect) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.HandleRedirect) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("LOGIN_FAILURE event does not reset inProgress while handleRedirect is in progress", async () => {
            const TestComponent = ({inProgress}: IMsalContext) => {    
                if (inProgress === InteractionStatus.HandleRedirect) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();
        });

        test("HANDLE_REDIRECT_END event does not reset inProgress when login is in progress", async () => {
            const TestComponent = ({inProgress}: IMsalContext) => {    
                if (inProgress === InteractionStatus.HandleRedirect) {
                    return <p>In Progress</p>;
                } else if (inProgress === InteractionStatus.Login) {
                    return <p>Login In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGIN_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Login In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Login In Progress")).toBeInTheDocument();
        });

        test("Login Success", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.Login) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.LOGIN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGIN_SUCCESS,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("Login Failure", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.Login) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.LOGIN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGIN_FAILURE,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("SsoSilent Success", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.SsoSilent) {
                    return <p>In Progress</p>;
                }

                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.SSO_SILENT_START,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.SSO_SILENT_SUCCESS,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("SsoSilent Failure", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.SsoSilent) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.SSO_SILENT_START,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.SSO_SILENT_FAILURE,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("Logout Failure", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.Logout) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.LOGOUT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.LOGOUT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenRedirect Success", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.AcquireToken) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_SUCCESS,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenRedirect Failure", async () => {        
            jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
                return Promise.reject(new Error("TEST ERROR: This should not break application flow"));
            });      

            const TestComponent = ({accounts, inProgress}: IMsalContext) => {
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.AcquireToken) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_FAILURE,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenPopup Success", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.AcquireToken) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_SUCCESS,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenPopup Failure", async () => {              
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {   
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.AcquireToken) {
                    return <p>In Progress</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("In Progress")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_FAILURE,
                interactionType: InteractionType.Popup,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenSilent Success", async () => {
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.None) {
                    return <p>AcquireTokenSilent does not update inProgress value</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("AcquireTokenSilent does not update inProgress value")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_SUCCESS,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("AcquireTokenSilent Failure", async () => {
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {    
                if (accounts.length === 1 && inProgress === InteractionStatus.None) {
                    return <p>Test Success!</p>;
                } else if (accounts.length === 0 && inProgress === InteractionStatus.None) {
                    return <p>AcquireTokenSilent does not update inProgress value</p>;
                }
                
                return null;
            };
    
            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            let eventMessage: EventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_START,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("AcquireTokenSilent does not update inProgress value")).toBeInTheDocument();

            eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_FAILURE,
                interactionType: InteractionType.Silent,
                payload: null,
                error: null,
                timestamp: 10000
            };
            cachedAccounts = [testAccount];

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });
    
            expect(await screen.findByText("Test Success!")).toBeInTheDocument();
        });

        test("Doesnt rerender when accounts or in progress dont change", async () => { 
            let inProgressRenders: string[] = [];            
            const TestComponent = ({accounts, inProgress}: IMsalContext) => {
                inProgressRenders.push(inProgress);
                if (accounts.length === 1) {
                    return <p>Test Success!</p>;
                }

                return null;
            };

            render(
                <MsalProvider instance={pca}>
                    <MsalConsumer>
                        {TestComponent}
                    </MsalConsumer>
                </MsalProvider>
            );

            await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

            const eventMessage = {
                eventType: EventType.ACQUIRE_TOKEN_SUCCESS,
                interactionType: null,
                payload: null,
                error: null,
                timestamp: 10000
            };

            act(() => {
                eventCallbacks.forEach((callback) => {
                    callback(eventMessage);
                });
            });

            expect(inProgressRenders).toEqual([
                InteractionStatus.Startup,
                InteractionStatus.HandleRedirect,
                InteractionStatus.None
            ]);
        });
    });

});
